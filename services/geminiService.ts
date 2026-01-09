import { ApiConfig, AnalyzeOptions, StoryboardData, Character, ComicData, BackendModel, DeconstructionResult, ProviderConfig } from '../types';
import { getAuthHeader } from './authService';
import { GoogleGenAI } from "@google/genai";

let apiConfig: ApiConfig = {
  baseUrl: "https://grsai.dakka.com.cn",
  apiKey: process.env.API_KEY || "", 
  textModel: "gemini-3-pro-preview",
  imageModel: "gemini-3-pro-image-preview", 
  videoModel: "veo-3.1-fast-generate-preview",
  provider: 'gemini',
  enableBackend: false,
  backendUrl: "http://localhost:3000/api",
  providers: {
      gemini: { baseUrl: "https://grsai.dakka.com.cn", apiKey: "" },
      yunwu: { baseUrl: "https://baleai.de5.net/v1", apiKey: "" },
      t8star: { baseUrl: "https://ai.t8star.cn/v1", apiKey: "" },
      tuzi: { baseUrl: "https://api.tu-zi.com/v1", apiKey: "" }
  }
};

export const setApiConfig = (config: ApiConfig) => {
  apiConfig = config;
};

export const getApiConfig = () => apiConfig;

// Helper to determine if we should use backend proxy
const useProxy = () => {
    return !!(apiConfig.enableBackend && apiConfig.backendUrl);
};

// Helper to identify network/SDK errors that should trigger fallback
const isSdkNetworkError = (e: any) => {
    const msg = (e.message || e.toString()).toLowerCase();
    return msg.includes('failed to fetch') || 
           msg.includes('rpc failed') || 
           msg.includes('xhr error') || 
           msg.includes('networkerror') ||
           msg.includes('500') || 
           msg.includes('unknown'); // SDK often throws generic unknown on network fail
};

const getGeminiClient = (overrideKey?: string, overrideBaseUrl?: string) => {
    const options: any = { apiKey: (overrideKey || apiConfig.apiKey || process.env.API_KEY || "").trim() };
    
    // Support custom Base URL for Gemini SDK (e.g. for Proxies)
    const baseUrl = overrideBaseUrl || apiConfig.baseUrl;
    if (baseUrl && !baseUrl.includes('googleapis.com')) {
        // Remove trailing slash
        let cleanBase = baseUrl.trim().replace(/\/+$/, '');
        // Remove trailing /v1 if present, as SDK appends its own version
        if (cleanBase.endsWith('/v1')) {
            cleanBase = cleanBase.slice(0, -3);
        }
        options.baseUrl = cleanBase;
    }
    
    return new GoogleGenAI(options);
};

// Helper to get the correct endpoint URL (For Non-Gemini Providers)
const getEndpoint = (path: string, isProxyRequest: boolean = false, overrideBaseUrl?: string, apiKeyForQuery?: string) => {
    if (useProxy() && isProxyRequest) {
        let backend = apiConfig.backendUrl.trim();
        if (backend.endsWith('/')) backend = backend.slice(0, -1);
        return `${backend}/proxy${path}`;
    }

    let base = overrideBaseUrl || apiConfig.baseUrl || "https://grsai.dakka.com.cn";
    base = base.trim();
    if (base.endsWith('/')) base = base.slice(0, -1);
    
    let cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    // Auto-fix double v1 or missing v1 issues for OpenAI compatible endpoints
    if (base.includes('/v1') && cleanPath.startsWith('v1/')) {
        cleanPath = cleanPath.slice(3);
    } else if (!base.includes('/v1') && !cleanPath.startsWith('v1/') && !cleanPath.startsWith('operations')) {
        // Only prepend v1 if it's not a root-level API like operations
        cleanPath = `v1/${cleanPath}`;
    }

    let url = `${base}/${cleanPath}`;
    
    // Fallback: If using Gemini provider via REST (custom URL), some proxies need key in query param
    if (!useProxy() && apiKeyForQuery && (base.includes('dakka') || base.includes('goog') || base.includes('free'))) {
       url += `${url.includes('?') ? '&' : '?'}key=${apiKeyForQuery}`;
    }

    return url;
};

const getHeaders = (key?: string, isProxyRequest: boolean = false) => {
    const headers: any = {
        "Content-Type": "application/json",
    };

    if (useProxy() && isProxyRequest) {
        const auth = getAuthHeader(); 
        if (auth && auth.Authorization) {
            headers["Authorization"] = auth.Authorization;
        }
    } else {
        // Priority: Function Arg > User Config > Env Var
        const finalKey = (key || apiConfig.apiKey || process.env.API_KEY || "").trim();
        if (finalKey) {
            headers["Authorization"] = `Bearer ${finalKey}`;
            // Optional: Standard Google header if someone uses a direct Vertex proxy
            headers["x-goog-api-key"] = finalKey; 
        }
    }
    return headers;
};

// --- Helper: Robust JSON Parsing ---
const cleanAndParseJSON = (text: string): any => {
    try {
        return JSON.parse(text);
    } catch (e) {
        const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
        const match = text.match(codeBlockRegex);
        if (match && match[1]) {
            try {
                return JSON.parse(match[1]);
            } catch (e2) {}
        }
        // Last resort: find first { and last }
        const first = text.indexOf('{');
        const last = text.lastIndexOf('}');
        if (first >= 0 && last > first) {
             try {
                return JSON.parse(text.substring(first, last + 1));
            } catch (e3) {}
        }
    }
    throw new Error("Failed to parse AI response as JSON");
};

const extractContent = (data: any): string => {
    if (data.choices && data.choices[0]?.message?.content) {
        return data.choices[0].message.content;
    }
    if (data.data && typeof data.data === 'string') {
        return data.data; // Some custom endpoints
    }
    if (data.error) {
        throw new Error(data.error.message || "Unknown API Error");
    }
    throw new Error("Invalid API response structure");
};

// --- NEW: Fetch Dynamic Models from Backend ---
export const fetchAvailableModels = async (): Promise<BackendModel[]> => {
    if (!useProxy()) return []; 
    
    try {
        const response = await fetch(`${apiConfig.backendUrl}/models`, {
            headers: getAuthHeader()
        });
        if (response.ok) {
            const data = await response.json();
            return data as BackendModel[];
        }
    } catch (e) {
        console.warn("Failed to fetch models from backend", e);
    }
    return [];
};

const handleResponseError = async (response: Response) => {
    let errorDetail = response.statusText;
    try {
        const errData = await response.json();
        if (errData.error?.message) errorDetail = errData.error.message;
        else if (errData.message) errorDetail = errData.message;
        else if (errData.msg) errorDetail = errData.msg;
        // Handle generic proxy error structure
        if (typeof errData === 'string') errorDetail = errData;
        // Handle the specific Rpc error format if it comes via JSON
        if (errData.error && errData.error.message) errorDetail = errData.error.message;
    } catch {}
    
    const status = response.status;
    // Enhance error message for quota issues
    if (status === 403 || status === 402 || errorDetail.includes('quota') || errorDetail.includes('额度不足') || errorDetail.includes('balance')) {
        throw new Error(`API Error: 403 用户额度不足 (Insufficient Quota). 请检查 API Key 余额。Detail: ${errorDetail}`);
    }

    throw new Error(`API Error: ${status} ${errorDetail}`);
};

export const generateTextTest = async () => {
     // If Gemini Direct
     if (apiConfig.provider === 'gemini' && !useProxy()) {
         try {
             const ai = getGeminiClient();
             await ai.models.generateContent({
                 model: apiConfig.textModel,
                 contents: { parts: [{ text: "ping" }] }
             });
             return;
         } catch (e: any) {
             // If SDK fails with network/RPC error, fall back to REST
             if (isSdkNetworkError(e)) {
                 console.warn("SDK failed (RPC/XHR), attempting REST fallback...", e);
             } else {
                 throw e;
             }
         }
     }

     const isProxy = useProxy();
     try {
        // Fix: Pass apiKey to getEndpoint for fallback REST call
        const response = await fetch(getEndpoint('chat/completions', isProxy, undefined, apiConfig.apiKey), {
            method: 'POST',
            headers: getHeaders(undefined, isProxy),
            body: JSON.stringify({
                model: apiConfig.textModel,
                messages: [{ role: "user", content: "ping" }],
                max_tokens: 5
            })
        });
        if (!response.ok) await handleResponseError(response);
     } catch (e: any) {
         if (e.message.includes('Failed to fetch')) {
             throw new Error("网络连接失败: 请检查 API 地址是否正确，或者是否由于跨域问题被拦截。");
         }
         throw e;
     }
};

export const analyzeScript = async (text: string, options: AnalyzeOptions): Promise<StoryboardData> => {
    // Default to Chinese if not specified (Optimized for Chinese Output)
    const isZh = options.lang === 'zh' || !options.lang;
    
    // Explicit Instruction for Strict Consistency and @Character Binding
    const strictInstruction = `
    CRITICAL INSTRUCTIONS:
    1. STRICTLY follow the Input Params (Genre: ${options.genre}, Style: ${options.style}).
    2. CHARACTER BINDING: If the input text uses "@Name" format (e.g., @Kaito), you MUST identify this as a specific character. 
       - In the "characters" array, capture their specific visual details exactly as described or implied.
       - In "shots", ensure this character is consistently referred to by name.
    3. CONSISTENCY: Ensure visual consistency. The character's description in 'visualDescriptionZh' and 't2iPrompt' MUST remain identical across all shots.
    4. NO HALLUCINATION: Do not invent characters if not in script unless necessary for background.
    5. LANGUAGE: Output narrative fields in Simplified Chinese (简体中文). Technical prompts (t2iPromptEn) in English.
    `;

    const prompt = `
    Role: Professional Film Director & Storyboard Artist.
    Task: Analyze the script and generate a structured JSON storyboard.
    
    Input Script: "${text}"
    ${strictInstruction}
    
    Return pure JSON matching:
    {
      "title": "String",
      "synopsis": "String",
      "characters": [
        { "name": "String", "gender": "String", "age": "String", "subjectDescription": "String (Detailed Visuals)", "visualPrompt": "String (Prompt)", "background": "String", "personality": "String", "coreProps": "String" }
      ],
      "scenes": [
        { "location": "String", "mood": "String", "timeOfDay": "String", "visualPrompt": "String" }
      ],
      "shots": [
        {
          "id": Number,
          "shotNumber": Number,
          "contentZh": "String (Chinese Action Description)",
          "contentEn": "String (English Action Description)",
          "visualDescriptionZh": "String (Chinese Visual Details - MUST include character visual traits)",
          "visualDescriptionEn": "String (English Visual Details)",
          "shotSize": "String",
          "cameraMovement": "String",
          "t2iPrompt": "String (Chinese Prompt - detailed)",
          "t2iPromptEn": "String (English Prompt - detailed)",
          "i2vPrompt": "String (Chinese Prompt)",
          "i2vPromptEn": "String (English Prompt)",
          "t2vPrompt": "String (Chinese Prompt)",
          "t2vPromptEn": "String (English Prompt)",
          "narrationZh": "String (Chinese Dialogue)",
          "narrationEn": "String (English Dialogue)",
          "duration": "String (e.g. '4s')"
        }
      ]
    }`;
    
    if (apiConfig.provider === 'gemini' && !useProxy()) {
        try {
            const ai = getGeminiClient();
            const response = await ai.models.generateContent({
                model: apiConfig.textModel,
                contents: { parts: [{ text: prompt }] },
                config: { responseMimeType: "application/json" }
            });
            return cleanAndParseJSON(response.text || "{}");
        } catch (e: any) {
             if (!isSdkNetworkError(e)) throw e;
             // If fetch failed, proceed to REST fallback below
             console.warn("SDK failed, falling back to REST for analyzeScript");
        }
    }

    const isProxy = useProxy();
    // Fix: Pass apiKey to getEndpoint
    const response = await fetch(getEndpoint('chat/completions', isProxy, undefined, apiConfig.apiKey), {
        method: 'POST',
        headers: getHeaders(undefined, isProxy),
        body: JSON.stringify({
            model: apiConfig.textModel, 
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        })
    });
    if (!response.ok) await handleResponseError(response);
    const data = await response.json();
    return cleanAndParseJSON(extractContent(data));
};

export const deconstructBook = async (text: string, model?: string): Promise<DeconstructionResult> => {
    const prompt = `Deconstruct this text: "${text.slice(0, 5000)}". Return JSON with title, characterDesign, plotDesign, emotionalBeats, imitationSuggestions. Output in Simplified Chinese.`;
    
    if (apiConfig.provider === 'gemini' && !useProxy()) {
        try {
            const ai = getGeminiClient();
            const response = await ai.models.generateContent({
                model: model || apiConfig.textModel,
                contents: { parts: [{ text: prompt }] },
                config: { responseMimeType: "application/json" }
            });
            return cleanAndParseJSON(response.text || "{}");
        } catch (e: any) {
            if (!isSdkNetworkError(e)) throw e;
        }
    }

    const isProxy = useProxy();
    // Fix: Pass apiKey
    const response = await fetch(getEndpoint('chat/completions', isProxy, undefined, apiConfig.apiKey), {
        method: 'POST',
        headers: getHeaders(undefined, isProxy),
        body: JSON.stringify({
            model: model || apiConfig.textModel,
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        })
    });
    if (!response.ok) await handleResponseError(response);
    const data = await response.json();
    return cleanAndParseJSON(extractContent(data));
};

export const generateImage = async (
    prompt: string, 
    aspectRatio: string, 
    model?: string, 
    n: number = 1, 
    refImage?: string, 
    maskImage?: string
): Promise<string> => {
    let size = '1024x1024';
    if (aspectRatio === '16:9') size = '1792x1024';
    else if (aspectRatio === '9:16') size = '1024x1792';

    // Prioritized Model Chain based on User Request
    // Primary: Nano Banana 2 (gemini-3-pro-image-preview) OR z-image-turbo
    // Fallbacks: doubao-seedream-4-5-251128, jimeng-4.5, kling-image
    const initialModel = model || apiConfig.imageModel || 'gemini-3-pro-image-preview';
    const fallbackModels = ['z-image-turbo', 'doubao-seedream-4-5-251128', 'jimeng-4.5', 'kling-image'];

    // Inner function to attempt generic generation via REST (handles all 3rd party + proxy Gemini)
    const callRestApi = async (targetModel: string): Promise<string> => {
        const isProxy = useProxy();
        // Fix: Pass apiKey here
        const endpoint = getEndpoint('images/generations', isProxy, undefined, apiConfig.apiKey);
        
        const response = await fetch(endpoint, {
             method: 'POST',
             headers: getHeaders(undefined, isProxy),
             body: JSON.stringify({
                model: targetModel,
                prompt: prompt,
                n: n,
                size: size,
                image_url: refImage,
                mask_url: maskImage
             })
        });
        
        if (!response.ok) await handleResponseError(response);
        const data = await response.json();
        
        if (data.data?.[0]?.url) return data.data[0].url;
        if (data.data?.[0]?.b64_json) return `data:image/png;base64,${data.data[0].b64_json}`;
        throw new Error("No image data returned via REST");
    };

    // Inner function for Gemini SDK
    const callGeminiSdk = async (targetModel: string): Promise<string> => {
        const ai = getGeminiClient();
        if (targetModel.toLowerCase().includes('imagen')) {
             const response = await ai.models.generateImages({
                model: targetModel,
                prompt: prompt,
                config: { numberOfImages: n, aspectRatio: aspectRatio as any }
             });
             const b64 = response.generatedImages?.[0]?.image?.imageBytes;
             if (b64) return `data:image/png;base64,${b64}`;
        } else {
             const response = await ai.models.generateContent({
                 model: targetModel,
                 contents: { parts: [{ text: prompt }] },
             });
             for (const part of response.candidates?.[0]?.content?.parts || []) {
                 if (part.inlineData) {
                     return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                 }
             }
        }
        throw new Error("No image data returned from Gemini SDK");
    };

    // EXECUTION LOGIC
    // Try Primary Model
    try {
        if (apiConfig.provider === 'gemini' && !useProxy() && (initialModel.includes('gemini') || initialModel.includes('imagen'))) {
            return await callGeminiSdk(initialModel);
        } else {
            return await callRestApi(initialModel);
        }
    } catch (primaryError: any) {
        console.warn(`Primary model ${initialModel} failed:`, primaryError);
        
        // If it was a network error with SDK, try REST with same model first
        if (isSdkNetworkError(primaryError) && apiConfig.provider === 'gemini') {
             try {
                 return await callRestApi(initialModel);
             } catch(e) {}
        }

        // Start Fallback Chain
        for (const fbModel of fallbackModels) {
            if (fbModel === initialModel) continue; // Skip if already tried
            try {
                console.log(`Falling back to ${fbModel}...`);
                return await callRestApi(fbModel);
            } catch (fbError) {
                console.warn(`Fallback ${fbModel} failed.`);
                continue;
            }
        }
        
        // If all fail, throw original error
        throw new Error(`Image Generation Failed: ${primaryError.message || "Unknown error"}`);
    }
};

export const generateRawText = async (prompt: string, model?: string): Promise<string> => {
    if (apiConfig.provider === 'gemini' && !useProxy()) {
        try {
            const ai = getGeminiClient();
            const response = await ai.models.generateContent({
                model: model || apiConfig.textModel,
                contents: { parts: [{ text: prompt }] }
            });
            return response.text || "";
        } catch (e: any) {
            if (!isSdkNetworkError(e)) throw e;
        }
    }

    const isProxy = useProxy();
    // Fix: Pass apiKey
    const response = await fetch(getEndpoint('chat/completions', isProxy, undefined, apiConfig.apiKey), {
        method: 'POST',
        headers: getHeaders(undefined, isProxy),
        body: JSON.stringify({
            model: model || apiConfig.textModel,
            messages: [{ role: "user", content: prompt }]
        })
    });
    if (!response.ok) await handleResponseError(response);
    const data = await response.json();
    return extractContent(data);
};

// --- VIDEO GENERATION ---

const processAsyncVideoResponse = async (
    response: Response, 
    onProgress: ((p: number, s: string) => void) | undefined,
    isProxy: boolean,
    baseUrl?: string,
    apiKey?: string
): Promise<string> => {
    const data = await response.json();
    
    // Handle synchronous return (some providers)
    if (data.data && Array.isArray(data.data) && data.data[0].url) {
        if (onProgress) onProgress(100, 'completed');
        return data.data[0].url;
    }
    
    // Handle async task ID
    const taskId = data.id || data.task_id || (data.data && data.data.task_id);
    if (!taskId) {
        throw new Error("No Task ID returned from video generation API");
    }

    let status = 'processing';
    let progress = 0;
    let videoUrl = '';
    let retries = 0;
    const maxRetries = 120; // 10 minutes max (5s interval)

    while (status !== 'succeeded' && status !== 'completed' && status !== 'failed' && retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Construct fetch url for status
        let fetchUrl = getEndpoint(`video/tasks/${taskId}`, isProxy, baseUrl, apiKey);
        
        const checkRes = await fetch(fetchUrl, {
            headers: getHeaders(apiKey, isProxy)
        });
        
        if (!checkRes.ok) {
            console.warn("Check status failed", checkRes.statusText);
            retries++;
            continue;
        }

        const checkData = await checkRes.json();
        // Normalize status
        status = checkData.status || checkData.data?.status; 
        
        // Progress (optional)
        if (checkData.progress) progress = checkData.progress;
        else if (status === 'processing') progress = Math.min(90, progress + 5); // Fake progress
        
        if (onProgress) onProgress(progress, status);

        if (status === 'succeeded' || status === 'completed') {
            videoUrl = checkData.output?.video_url || checkData.data?.video?.url || checkData.result?.video_url || checkData.url;
            // Handle array output
            if (!videoUrl && Array.isArray(checkData.data) && checkData.data[0]?.url) {
                videoUrl = checkData.data[0].url;
            }
            if (!videoUrl) throw new Error("Task succeeded but video URL is missing");
        } else if (status === 'failed') {
            throw new Error(`Video Generation Failed: ${checkData.error || checkData.message || "Unknown Error"}`);
        }
        retries++;
    }

    if (!videoUrl) throw new Error("Video generation timed out");
    return videoUrl;
};

const attemptGenerateVideo = async (
    params: any,
    provider: 'gemini' | 'yunwu' | 't8star' | 'tuzi',
    specificConfig?: ProviderConfig
): Promise<string> => {
    
    const activeBaseUrl = specificConfig?.baseUrl || apiConfig.baseUrl;
    const activeApiKey = (specificConfig?.apiKey || apiConfig.apiKey || process.env.API_KEY || "").trim();
    const model = params.modelName || apiConfig.videoModel;

    // VEO / GEMINI DIRECT VIDEO via SDK
    const isVeo = !model || model.toLowerCase().includes('veo') || model.includes('gemini');
    const useSdk = provider === 'gemini' && !useProxy() && isVeo;

    if (useSdk) {
        const ai = getGeminiClient(activeApiKey, activeBaseUrl);
        const getBase64 = (dataUrl: string) => dataUrl.split(',')[1];
        const getMimeType = (dataUrl: string) => dataUrl.substring(dataUrl.indexOf(':') + 1, dataUrl.indexOf(';'));

        let operation;
        const config: any = { numberOfVideos: 1, aspectRatio: params.aspectRatio as any };

        try {
            if (params.imageUrl && !params.lastFrameUrl) {
                operation = await ai.models.generateVideos({
                    model: model,
                    prompt: params.prompt,
                    image: { imageBytes: getBase64(params.imageUrl), mimeType: getMimeType(params.imageUrl) },
                    config: config
                });
            } else if (params.imageUrl && params.lastFrameUrl) {
                config.lastFrame = { imageBytes: getBase64(params.lastFrameUrl), mimeType: getMimeType(params.lastFrameUrl) };
                operation = await ai.models.generateVideos({
                    model: model,
                    prompt: params.prompt,
                    image: { imageBytes: getBase64(params.imageUrl), mimeType: getMimeType(params.imageUrl) },
                    config: config
                });
            } else {
                operation = await ai.models.generateVideos({
                    model: model,
                    prompt: params.prompt,
                    config: config
                });
            }

            let retryCount = 0;
            while (!operation.done) {
                if (retryCount > 60) throw new Error("Video generation timed out");
                if (params.onProgress) params.onProgress(Math.min(99, retryCount * 2), 'generating');
                await new Promise(resolve => setTimeout(resolve, 5000));
                operation = await ai.operations.getVideosOperation({operation: operation});
                retryCount++;
            }
            
            const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (!videoUri) throw new Error("API completed but returned no video URI.");
            return `${videoUri}&key=${activeApiKey}`;

        } catch (e: any) {
            console.error("Gemini SDK Video Error:", e);
            // Fallback to REST on network error
            if (isSdkNetworkError(e) && activeBaseUrl && !activeBaseUrl.includes('googleapis.com')) {
                 console.warn("Gemini SDK Failed (Likely Proxy issue). Falling back to REST/OpenAI format.");
            } else {
                 throw new Error(`Gemini Video Gen Failed: ${e.message}`);
            }
        }
    }

    // 3RD PARTY / FALLBACK PROVIDER HANDLING (HTTP Fetch)
    const isProxy = useProxy();
    
    // Logic: Map specific model names to endpoints if needed, or default to standard
    let endpointPath = 'video/generations'; 
    if (model.includes('kling')) endpointPath = 'video/kling/generations'; 
    else if (model.includes('luma')) endpointPath = 'video/luma/generations';
    else if (model.includes('runway') || model.includes('gen3')) endpointPath = 'video/runway/generations';
    else if (model.includes('hailuo') || model.includes('minimax')) endpointPath = 'video/minimax/generations';
    else if (model.includes('jimeng')) endpointPath = 'video/jimeng/generations';
    else if (model.includes('wan')) endpointPath = 'video/wan/generations'; // Wan2.1

    const endpoint = getEndpoint(endpointPath, isProxy, activeBaseUrl, activeApiKey);
    const headers = getHeaders(activeApiKey, isProxy);

    console.log(`Attempting video gen via ${provider} at ${endpoint} with model ${model}`);

    const body: any = {
        model: model,
        prompt: params.prompt,
        aspect_ratio: params.aspectRatio,
        duration: params.duration
    };
    if (params.imageUrl) body.image_url = params.imageUrl;
    if (params.lastFrameUrl) body.last_frame_image = params.lastFrameUrl;
    
    // Pass specialized params if supported by backend proxy
    if (params.subjectUrl) body.subject_url = params.subjectUrl;
    if (params.audioUrl) body.audio_url = params.audioUrl;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        // Fallback for Veo specific path if generic fails
        if (response.status === 404 && endpointPath === 'video/generations') {
             const fallbackEndpoint = getEndpoint('video/veo', isProxy, activeBaseUrl, activeApiKey);
             const fallbackRes = await fetch(fallbackEndpoint, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    model: model,
                    prompt: params.prompt,
                    imageUrl: params.imageUrl, 
                    aspectRatio: params.aspectRatio
                })
             });
             if (!fallbackRes.ok) await handleResponseError(fallbackRes);
             return processAsyncVideoResponse(fallbackRes, params.onProgress, isProxy, activeBaseUrl, activeApiKey);
        }
        await handleResponseError(response);
    }
    
    return processAsyncVideoResponse(response, params.onProgress, isProxy, activeBaseUrl, activeApiKey);
};

export const generateVideo = async (
    prompt: string, 
    imageUrl: string | undefined,
    aspectRatio: string,
    modelName: string,
    onProgress?: (progress: number, status: string) => void,
    lastFrameUrl?: string,
    duration?: number,
    sourceVideoUrl?: string,
    subjectUrl?: string,
    audioUrl?: string
): Promise<string> => {
    // Try primary provider first, then fallbacks if configured
    const primaryProvider = apiConfig.provider;
    const providers = Object.keys(apiConfig.providers || {}) as ('gemini' | 'yunwu' | 't8star' | 'tuzi')[];
    
    // Sort so primary is first
    const sortedProviders = [
        primaryProvider,
        ...providers.filter(p => p !== primaryProvider)
    ];

    let lastError;

    for (const provider of sortedProviders) {
        try {
            return await attemptGenerateVideo({
                prompt, imageUrl, aspectRatio, modelName, onProgress, lastFrameUrl, duration, sourceVideoUrl, subjectUrl, audioUrl
            }, provider, apiConfig.providers?.[provider]);
        } catch (e: any) {
            console.warn(`Video gen failed with provider ${provider}:`, e);
            lastError = e;
            // Don't retry if it's a prompt issue or explicit 400
            if (e.message.includes('400') || e.message.includes('invalid')) throw e;
        }
    }
    throw lastError || new Error("All video providers failed");
};

export const extractCharacters = async (text: string): Promise<Character[]> => {
    const prompt = `
    Analyze the following text and extract character details. 
    Return a JSON array of characters with fields: name, gender, age, subjectDescription (appearance), personality, tags (array of strings), visualPrompt (for AI image generation).
    Text: "${text.slice(0, 4000)}"
    `;
    
    if (apiConfig.provider === 'gemini' && !useProxy()) {
        try {
            const ai = getGeminiClient();
            const result = await ai.models.generateContent({
                model: apiConfig.textModel,
                contents: { parts: [{ text: prompt }] },
                config: { responseMimeType: "application/json" }
            });
            const json = cleanAndParseJSON(result.text || "[]");
            return Array.isArray(json) ? json : (json.characters || []);
        } catch(e) { console.error(e); }
    }

    const isProxy = useProxy();
    const response = await fetch(getEndpoint('chat/completions', isProxy, undefined, apiConfig.apiKey), {
        method: 'POST',
        headers: getHeaders(undefined, isProxy),
        body: JSON.stringify({
            model: apiConfig.textModel,
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        })
    });
    if (!response.ok) await handleResponseError(response);
    const data = await response.json();
    const content = extractContent(data);
    const json = cleanAndParseJSON(content);
    return Array.isArray(json) ? json : (json.characters || []);
};

export const generateComicScript = async (promptText: string, style: string): Promise<ComicData> => {
    const prompt = `
    Role: Professional Comic Scriptwriter.
    Task: Create a comic script based on this idea: "${promptText}". Style: ${style}.
    Return JSON with:
    - title: string
    - style: string
    - panels: Array of { 
        id: number, 
        panelNumber: number, 
        description: string (action), 
        visualPrompt: string (detailed AI image prompt describing visual only), 
        caption: string (dialogue or narration) 
      }
    `;
    
    if (apiConfig.provider === 'gemini' && !useProxy()) {
        const ai = getGeminiClient();
        const result = await ai.models.generateContent({
            model: apiConfig.textModel,
            contents: { parts: [{ text: prompt }] },
            config: { responseMimeType: "application/json" }
        });
        return cleanAndParseJSON(result.text || "{}");
    }
    
    const isProxy = useProxy();
    const response = await fetch(getEndpoint('chat/completions', isProxy, undefined, apiConfig.apiKey), {
        method: 'POST',
        headers: getHeaders(undefined, isProxy),
        body: JSON.stringify({
            model: apiConfig.textModel,
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        })
    });
    if (!response.ok) await handleResponseError(response);
    const data = await response.json();
    return cleanAndParseJSON(extractContent(data));
};

export const adaptStoryboardToComic = async (storyboard: StoryboardData, style: string): Promise<ComicData> => {
    const prompt = `
    Role: Comic Editor.
    Task: Adapt this film storyboard into a comic book script. Style: ${style}.
    Input Storyboard Title: ${storyboard.title}
    Input Shots: ${JSON.stringify(storyboard.shots.map(s => ({ content: s.contentZh, visual: s.visualDescriptionZh, dialogue: s.narrationZh })))}
    
    Return JSON with: title, style, panels (array of id, panelNumber, description, visualPrompt, caption).
    Ensure visualPrompt is optimized for AI image generation in ${style} style.
    `;
    
    if (apiConfig.provider === 'gemini' && !useProxy()) {
        const ai = getGeminiClient();
        const result = await ai.models.generateContent({
            model: apiConfig.textModel,
            contents: { parts: [{ text: prompt }] },
            config: { responseMimeType: "application/json" }
        });
        return cleanAndParseJSON(result.text || "{}");
    }

    const isProxy = useProxy();
    const response = await fetch(getEndpoint('chat/completions', isProxy, undefined, apiConfig.apiKey), {
        method: 'POST',
        headers: getHeaders(undefined, isProxy),
        body: JSON.stringify({
            model: apiConfig.textModel,
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        })
    });
    if (!response.ok) await handleResponseError(response);
    const data = await response.json();
    return cleanAndParseJSON(extractContent(data));
};

export const optimizeImagePrompt = async (originalPrompt: string): Promise<string> => {
    const prompt = `Optimize this image prompt for a high-quality AI generator (Midjourney/DALL-E 3 style). Make it detailed, descriptive, and artistic. Return ONLY the optimized prompt text. Input: "${originalPrompt}"`;
    return await generateRawText(prompt);
};

export const editVideo = async (sourceVideoUrl: string, instruction: string, model: string): Promise<string> => {
    return await generateVideo(
        instruction, 
        undefined, 
        '16:9', 
        model, 
        undefined, 
        undefined, 
        undefined, 
        sourceVideoUrl 
    );
};