
// ... existing imports ...
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ImageIcon, Wand2, RefreshCw, Upload, Download, Copy, Trash2, Zap, Settings2, Sparkles, Layers, Edit3, Eraser, Check, X, Type as TypeIcon, MousePointer2, Move, Crop, Maximize, Scissors, Box, MoreHorizontal, Clock, Image, ChevronDown, Server, MessageSquare, Palette, Share2, ScanFace } from 'lucide-react';
import * as GeminiService from '../services/geminiService';
import FancyLoader from './FancyLoader';

interface ImageGenViewProps {
  onBack: () => void;
}

const STYLE_CATEGORIES: Record<string, string[]> = {
  '画风类型': ['写实风格', 'Q版风格', 'SD风格', '像素风格', '超现实主义风格', '摄影写实', '史诗级电影', '好莱坞大片', '胶片电影风', '黏土动画风', '二次元插画风'],
  '中国动漫': ['新风都市', '水墨画风格', '国潮风格', '古风仙侠', '皮影戏风格', '木偶戏风格', '武侠风格', '修仙风格', '年画风格', '京剧脸谱风格', '玄幻风格', '神话风格'],
  '美国动漫': ['迪士尼经典风格', '皮克斯3D风格', '漫威动画风格'],
  '欧洲动漫': ['俄罗斯动画风格', '德国动画风格', '西班牙动画风格', '意大利动画风格', '法国动画风格', '比利时漫画风格', '匈牙利动画风格', '荷兰动画风格', '瑞士动画风格', '希腊动画风格'],
  '日本动漫': ['海贼王风格', '宫崎骏风格', '火影忍者', '新海诚风格', '战国武将风格', '忍者风格', '青年漫画风格', '少女漫画风格', '儿童向风格', '机甲风格', '校园风格', '推理悬疑风格', '恐怖惊悚风格', '神话传说风格', '禅意风格']
};

const PROVIDER_OPTIONS = [
    { label: 'Gemini (Google)', value: 'gemini' },
    { label: '芭乐 (Bale)', value: 'yunwu' },
    { label: 'T8Star', value: 't8star' },
    { label: '兔子 (Tuzi)', value: 'tuzi' },
];

const PROVIDER_MODELS: Record<string, string[]> = {
    'gemini': [
        'nano-banana-pro', 
        'gemini-3-pro-image-preview', 
        'gemini-2.5-flash-image', 
        'imagen-3.0-generate-001'
    ],
    'yunwu': [
        'dall-e-3', 'midjourney', 'flux', 'ideogram', 
        'jimeng-4.5', 'doubao-seedream-4-5-251128', 'kling-image', 'z-image-turbo', 'qwen-image-edit-2509', 'doubao-seededit-3-0-i2i-250628', 'ideogram-replace-background-v3'
    ],
    't8star': [
        'dall-e-3', 'midjourney', 'flux', 'recraft-v3', 
        'jimeng-4.5', 'kling-image', 'qwen-image-edit-2509', 'doubao-seededit-3-0-i2i-250628'
    ],
    'tuzi': [
        'dall-e-3', 'midjourney', 'flux', 'flux-schnell', 
        'jimeng-4.5', 'kling-image', 'doubao-seedream-4-5-251128'
    ]
};

// Available Edit Models for the Floating Bar
const EDIT_MODELS = [
    { id: 'z-image-turbo', name: 'Z-Image Turbo' },
    { id: 'qwen-image-edit-2509', name: 'Qwen Edit' },
    { id: 'ideogram-replace-background-v3', name: 'Ideogram BG' },
    { id: 'doubao-seededit-3-0-i2i-250628', name: 'Doubao SeedEdit' },
    { id: 'nano-banana-pro', name: 'Nano Banana' },
    { id: 'gemini-3-pro-image-preview', name: 'Gemini 3 Pro' },
    { id: 'jimeng-4.5', name: 'Jimeng 4.5' },
    { id: 'doubao-seedream-4-5-251128', name: 'Doubao Seedream' },
    { id: 'kling-image', name: 'Kling Image' }
];

interface GeneratedImage {
    id: string;
    url: string;
    prompt: string;
    model: string;
    timestamp: number;
}

type EditTool = 'brush' | 'element' | 'text' | 'expand' | 'zoom' | 'removebg' | 'mockup' | 'vector' | 'layers' | 'blend' | 'variant';

const ImageGenView: React.FC<ImageGenViewProps> = ({ onBack }) => {
  // Config State
  const [mode, setMode] = useState<'text2img' | 'img2img'>('text2img');
  const [prompt, setPrompt] = useState('');
  
  // Initialize from global config
  const initialConfig = GeminiService.getApiConfig();
  const [model, setModel] = useState(initialConfig.imageModel || 'nano-banana-pro');
  const [currentProvider, setCurrentProvider] = useState<string>(initialConfig.provider || 'gemini');
  
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [generateCount, setGenerateCount] = useState(1);
  const [refImage, setRefImage] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  
  // App State
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Editor State
  const [isEditing, setIsEditing] = useState(false);
  const [activeTool, setActiveTool] = useState<EditTool>('brush');
  const [editPrompt, setEditPrompt] = useState('');
  const [brushSize, setBrushSize] = useState(40);
  const [editCanvasRef, setEditCanvasRef] = useState<HTMLCanvasElement | null>(null);
  const [editModel, setEditModel] = useState(EDIT_MODELS[0].id); // State for floating bar model
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync model list when provider changes or view loads
  useEffect(() => {
      const loadModels = async () => {
          const config = GeminiService.getApiConfig();
          let models: string[] = [];
          
          if (config.enableBackend) {
              try {
                  const backendModels = await GeminiService.fetchAvailableModels();
                  const imgModels = backendModels.filter(m => m.type === 'image');
                  if (imgModels.length > 0) {
                      models = imgModels.map(m => m.id);
                  }
              } catch (e) {}
          }
          
          if (models.length === 0) {
              models = PROVIDER_MODELS[currentProvider] || PROVIDER_MODELS['gemini'];
          }
          
          setAvailableModels(models);
      };
      
      loadModels();
  }, [currentProvider]);

  // Handle Edit Model Change -> Auto Switch Provider
  useEffect(() => {
      // Find a provider that supports the selected edit model
      let foundProvider = currentProvider;
      if (PROVIDER_MODELS[currentProvider]?.includes(editModel)) {
          // Current supports it
      } else {
          // Search others
          for (const [p, mods] of Object.entries(PROVIDER_MODELS)) {
              if (mods.includes(editModel)) {
                  foundProvider = p;
                  break;
              }
          }
      }

      if (foundProvider !== currentProvider) {
          console.log(`Auto-switching provider to ${foundProvider} for model ${editModel}`);
          setCurrentProvider(foundProvider);
          const currentConfig = GeminiService.getApiConfig();
          GeminiService.setApiConfig({ ...currentConfig, provider: foundProvider as any });
      }
  }, [editModel]);

  const handleProviderChange = (newProvider: string) => {
      setCurrentProvider(newProvider);
      
      const currentConfig = GeminiService.getApiConfig();
      GeminiService.setApiConfig({ ...currentConfig, provider: newProvider as any });

      const newModels = PROVIDER_MODELS[newProvider] || [];
      if (newModels.length > 0) {
          setAvailableModels(newModels);
          setModel(newModels[0]);
          GeminiService.setApiConfig({ ...currentConfig, provider: newProvider as any, imageModel: newModels[0] });
      }
  };

  const handleModelChange = (newModel: string) => {
      setModel(newModel);
      const currentConfig = GeminiService.getApiConfig();
      GeminiService.setApiConfig({ ...currentConfig, imageModel: newModel });
  };

  const handleGenerate = async () => {
      if (!prompt.trim()) return;
      setIsGenerating(true);
      setErrorMsg(null);
      
      try {
          const finalPrompt = selectedStyle ? `${selectedStyle}, ${prompt}` : prompt;
          
          const promises = Array.from({ length: generateCount }).map(() => 
              GeminiService.generateImage(finalPrompt, aspectRatio, model, 1, refImage || undefined)
          );

          const results = await Promise.all(promises);
          
          const newImages: GeneratedImage[] = results.map(url => ({
              id: Date.now().toString() + Math.random(),
              url,
              prompt: finalPrompt,
              model,
              timestamp: Date.now()
          }));
          
          if (newImages.length > 0) {
              setCurrentImage(newImages[0]);
              setHistory(prev => [...newImages, ...prev]);
          }

      } catch (e: any) {
          let msg = e.message || "生成失败";
          if (msg.includes('403') || msg.includes('额度不足') || msg.includes('balance') || msg.includes('Quota')) {
             msg = "API 余额不足 (403)。请检查配置。";
          }
          setErrorMsg(msg);
      } finally {
          setIsGenerating(false);
      }
  };

  const handleOptimizePrompt = async () => {
      if (!prompt.trim()) return;
      setIsOptimizing(true);
      try {
          const optimized = await GeminiService.optimizeImagePrompt(prompt);
          setPrompt(optimized);
      } catch (e) {
          console.error(e);
      } finally {
          setIsOptimizing(false);
      }
  };

  const handleUploadRefImage = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => setRefImage(reader.result as string);
          reader.readAsDataURL(file);
      }
  };

  const selectHistoryItem = (item: GeneratedImage) => {
      setCurrentImage(item);
      setIsEditing(false); 
      setEditPrompt('');
  };

  // --- EDITOR LOGIC ---
  
  const startEditing = () => {
      setIsEditing(true);
      setActiveTool('brush');
      setEditPrompt('');
      setTimeout(() => initCanvas(), 100);
  };

  const initCanvas = () => {
      const canvas = document.getElementById('paint-canvas') as HTMLCanvasElement;
      if (!canvas || !canvasContainerRef.current) return;
      
      const { width, height } = canvasContainerRef.current.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'; 
          ctx.lineWidth = brushSize;
      }
      setEditCanvasRef(canvas);
  };

  const handleDraw = (e: React.MouseEvent) => {
      if (!isEditing || !editCanvasRef || e.buttons !== 1) return;
      if (['expand', 'zoom', 'removebg', 'mockup', 'vector', 'layers', 'blend', 'variant'].includes(activeTool)) return;

      const ctx = editCanvasRef.getContext('2d');
      if (!ctx) return;

      const rect = editCanvasRef.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      ctx.lineWidth = brushSize;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'; 
      ctx.globalCompositeOperation = 'source-over'; 

      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
  };

  const startDraw = (e: React.MouseEvent) => {
      if (!editCanvasRef) return;
      if (['expand', 'zoom', 'removebg', 'mockup', 'vector', 'layers', 'blend', 'variant'].includes(activeTool)) return;

      const ctx = editCanvasRef.getContext('2d');
      if (!ctx) return;
      ctx.beginPath();
      const rect = editCanvasRef.getBoundingClientRect();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleToolClick = (tool: EditTool) => {
      setActiveTool(tool);
      if (tool === 'removebg') setEditPrompt('remove background, pure white background');
      if (tool === 'vector') setEditPrompt('convert to vector art, flat style, svg');
      if (tool === 'expand') setEditPrompt('outpaint, expand view');
      // For others, user types prompt
  };

  const handleSubmitEdit = async () => {
      if (!currentImage) return;
      
      // Use selected edit model
      const targetModel = editModel;
      
      let finalEditPrompt = editPrompt.trim();
      if (!finalEditPrompt) {
          if (activeTool === 'brush' && isEditing) finalEditPrompt = "remove object, clean background"; 
          else finalEditPrompt = currentImage.prompt; 
      }

      setIsGenerating(true);
      setIsEditing(false); 

      try {
          let maskDataUrl = undefined;

          if (isEditing && editCanvasRef && activeTool === 'brush') {
              const tempCanvas = document.createElement('canvas');
              tempCanvas.width = editCanvasRef.width;
              tempCanvas.height = editCanvasRef.height;
              const tCtx = tempCanvas.getContext('2d');
              if (tCtx) {
                  tCtx.fillStyle = 'black';
                  tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                  tCtx.globalCompositeOperation = 'source-over';
                  tCtx.drawImage(editCanvasRef, 0, 0);
                  tCtx.globalCompositeOperation = 'lighter';
                  tCtx.drawImage(editCanvasRef, 0, 0);
                  maskDataUrl = tempCanvas.toDataURL('image/png');
              }
          }
          
          console.log(`Submitting Edit: Provider=${currentProvider}, Model=${targetModel}, Prompt=${finalEditPrompt}`);

          const newUrl = await GeminiService.generateImage(
              finalEditPrompt, 
              aspectRatio, 
              targetModel, 
              1, 
              currentImage.url, 
              maskDataUrl 
          );
          
          const newImage: GeneratedImage = {
              id: Date.now().toString(),
              url: newUrl,
              prompt: finalEditPrompt,
              model: targetModel,
              timestamp: Date.now()
          };
          setCurrentImage(newImage);
          setHistory(prev => [newImage, ...prev]);
          setEditPrompt(''); 

      } catch (e: any) {
          let msg = e.message || "编辑失败";
          if (msg.includes('403') || msg.includes('额度不足') || msg.includes('balance') || msg.includes('Quota')) {
             msg = "API 余额不足 (403)。请检查配置。";
          }
          setErrorMsg(msg);
      } finally {
          setIsGenerating(false);
      }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col animate-fade-in">
        
        {/* Header */}
        <div className="h-16 border-b border-[#262626] bg-[#141414] px-4 md:px-6 flex items-center justify-between shrink-0 sticky top-0 z-50">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <ImageIcon className="text-emerald-500" /> <span className="hidden sm:inline">神笔马良 · </span>图片生成
                </h2>
            </div>
        </div>

        {/* 3-Column Layout: Config | Preview | History - ADAPTIVE STACKING FOR MOBILE */}
        <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
            
            {/* COLUMN 1: Configuration (Left on Desktop, Top on Mobile) */}
            <div className="w-full md:w-80 bg-[#111] border-b md:border-b-0 md:border-r border-[#262626] flex flex-col p-4 md:p-6 overflow-y-auto custom-scrollbar md:h-full shrink-0 z-10 order-2 md:order-1">
                
                {/* Tabs */}
                <div className="flex bg-[#1a1a1a] p-1 rounded-lg mb-6 border border-[#333]">
                    <button 
                        onClick={() => setMode('text2img')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${mode === 'text2img' ? 'bg-[#333] text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        文生图 (T2I)
                    </button>
                    <button 
                         onClick={() => setMode('img2img')}
                         className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${mode === 'img2img' ? 'bg-[#333] text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        图生图 (I2I)
                    </button>
                </div>

                {/* Prompt Section */}
                <div className="mb-6 space-y-2 relative">
                    <label className="text-sm font-bold text-gray-300 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Upload size={14} className="text-emerald-500" />
                            图片创意 (Prompt)
                        </div>
                        <button 
                            onClick={handleOptimizePrompt}
                            disabled={isOptimizing || !prompt}
                            className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 disabled:opacity-50 transition-all bg-purple-900/20 px-2 py-0.5 rounded border border-purple-500/30"
                            title="点击 AI 优化您的提示词"
                        >
                            <Wand2 size={12} className={isOptimizing ? 'animate-spin' : ''} /> 
                            {isOptimizing ? '优化中...' : '优化'}
                        </button>
                    </label>
                    <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full h-32 md:h-40 bg-[#1a1a1a] border border-[#333] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500 resize-none placeholder-gray-600 leading-relaxed transition-all"
                        placeholder={mode === 'img2img' ? "描述你想如何修改参考图..." : "描述你想要的画面..."}
                    />
                </div>

                {/* Ref Image Upload for I2I */}
                {mode === 'img2img' && (
                    <div className="mb-6 space-y-2">
                        <label className="text-sm font-bold text-gray-300">参考图 (Reference)</label>
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-24 bg-[#1a1a1a] border-2 border-dashed border-[#333] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500/50 hover:bg-[#222] transition-all relative overflow-hidden group"
                        >
                            {refImage ? (
                                <>
                                    <img src={refImage} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                                    <div className="absolute inset-0 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 font-bold text-xs">
                                        点击更换
                                    </div>
                                </>
                            ) : (
                                <>
                                    <ImageIcon className="text-gray-600 mb-2" size={24} />
                                    <span className="text-xs text-gray-500">点击上传参考图</span>
                                </>
                            )}
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUploadRefImage} />
                        </div>
                    </div>
                )}

                <div className="mb-6 space-y-2">
                    <label className="text-sm font-bold text-gray-300 flex items-center gap-2">
                        <Zap size={14} className="text-yellow-500" />
                        生成模型 (Model)
                    </label>
                    <div className="flex flex-col gap-2">
                        {/* 1. API Platform Selection */}
                        <div className="relative">
                            <select
                                value={currentProvider}
                                onChange={(e) => handleProviderChange(e.target.value)}
                                className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg pl-8 pr-8 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 appearance-none font-bold"
                            >
                                {PROVIDER_OPTIONS.map(p => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                            <Server size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
                        </div>

                        {/* 2. Model Selection */}
                        <div className="relative">
                            <select 
                                value={model}
                                onChange={(e) => handleModelChange(e.target.value)}
                                className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg pl-3 pr-8 py-2 text-sm text-emerald-400 focus:outline-none focus:border-emerald-500 appearance-none font-mono"
                            >
                                {availableModels.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                <ChevronDown size={14} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Settings Group */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-300">生成数量: <span className="text-emerald-500">{generateCount}</span></label>
                        <div className="flex items-center gap-4 bg-[#1a1a1a] p-2 rounded-lg border border-[#333]">
                             <input 
                                type="range" 
                                min="1" 
                                max="4" 
                                value={generateCount} 
                                onChange={(e) => setGenerateCount(parseInt(e.target.value))}
                                className="w-full accent-emerald-500 h-1 bg-[#333] rounded-lg appearance-none cursor-pointer" 
                             />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-300">风格</label>
                        <select 
                            value={selectedStyle}
                            onChange={(e) => setSelectedStyle(e.target.value)}
                            className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 appearance-none"
                        >
                            <option value="">Default</option>
                            {Object.entries(STYLE_CATEGORIES).map(([category, styles]) => (
                                <optgroup key={category} label={category}>
                                    {styles.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mb-6 space-y-2">
                    <label className="text-sm font-bold text-gray-300">图片比例</label>
                    <div className="grid grid-cols-5 gap-2">
                        {['1:1', '16:9', '9:16', '4:3', '3:4'].map(ratio => (
                            <button
                                key={ratio}
                                onClick={() => setAspectRatio(ratio)}
                                className={`py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${aspectRatio === ratio ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-[#1a1a1a] border-[#333] text-gray-500 hover:border-gray-500'}`}
                            >
                                {ratio}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4 mt-auto pt-6 border-t border-[#262626]">
                    <button 
                        onClick={handleGenerate}
                        disabled={isGenerating || !prompt.trim() || (mode === 'img2img' && !refImage)}
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40"
                    >
                        {isGenerating ? <RefreshCw className="animate-spin" /> : <Wand2 />}
                        {isGenerating ? "生成中..." : `生成图片 (x${generateCount})`}
                    </button>
                </div>
            </div>

            {/* COLUMN 2: Result Preview (Center, Flex-1) - Top on Mobile */}
            <div className="flex-1 bg-[#0a0a0a] flex flex-col relative overflow-hidden order-1 md:order-2 min-h-[400px] md:min-h-0">
                
                {/* Main Viewport */}
                <div className="flex-1 flex items-center justify-center p-4 md:p-8 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] relative overflow-hidden" ref={canvasContainerRef}>
                    
                    {currentImage ? (
                        <div className="relative shadow-2xl rounded-lg overflow-hidden border border-[#333] group max-h-full max-w-full inline-block animate-fade-in-up">
                             <img 
                                src={currentImage.url} 
                                alt="Generated" 
                                className="max-w-full max-h-[50vh] md:max-h-[85vh] object-contain block" 
                                style={{ opacity: isEditing ? 0.9 : 1, filter: isEditing ? 'grayscale(10%)' : 'none', transition: 'all 0.3s' }}
                             />
                             
                             {/* EDITOR CANVAS */}
                             {isEditing && (
                                 <canvas
                                    id="paint-canvas"
                                    className={`absolute inset-0 touch-none ${activeTool === 'text' ? 'cursor-text' : 'cursor-crosshair'}`}
                                    onMouseDown={startDraw}
                                    onMouseMove={handleDraw}
                                    onMouseUp={() => {}}
                                    onMouseLeave={() => {}}
                                 />
                             )}

                             {/* Hover Actions (Disable when editing) */}
                             {!isEditing && (
                                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                    <a 
                                        href={currentImage.url} 
                                        download={`generated-${currentImage.id}.png`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 bg-black/60 text-white rounded-lg hover:bg-black/80 backdrop-blur-sm hover:scale-105 transition-transform"
                                        title="Download"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Download size={20} />
                                    </a>
                                    <button 
                                        onClick={startEditing}
                                        className="p-2 bg-white text-black rounded-lg hover:bg-gray-200 backdrop-blur-sm shadow-lg hover:scale-105 transition-transform"
                                        title="Brush Edit / Masking"
                                    >
                                        <Edit3 size={20} />
                                    </button>
                                </div>
                             )}
                        </div>
                    ) : isGenerating ? (
                        <div className="flex flex-col items-center gap-4">
                            <FancyLoader type="image" size="lg" text="GENERATING..." />
                        </div>
                    ) : (
                        <div className="text-center text-gray-600 flex flex-col items-center">
                            <div className="w-32 h-32 bg-[#111] rounded-3xl flex items-center justify-center mb-6 border border-[#222]">
                                <Image size={64} className="opacity-20" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-500">画布区域</h3>
                            <p className="text-sm mt-2">在左侧配置参数并点击生成</p>
                        </div>
                    )}

                    {/* PRO EDITING TOOLBAR */}
                    {isEditing && (
                        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white rounded-lg px-2 py-1.5 flex items-center gap-1 shadow-2xl animate-fade-in-up z-20 text-gray-800 border border-gray-200 overflow-x-auto max-w-[90%] no-scrollbar">
                             <button onClick={() => handleToolClick('removebg')} className="flex items-center gap-1 px-3 py-1.5 hover:bg-gray-100 rounded-md transition-colors text-xs font-medium text-gray-600 whitespace-nowrap">
                                <Scissors size={14} /> 抠图
                             </button>
                             <button onClick={() => handleToolClick('expand')} className="flex items-center gap-1 px-3 py-1.5 hover:bg-gray-100 rounded-md transition-colors text-xs font-medium text-gray-600 whitespace-nowrap">
                                <Crop size={14} /> 扩图
                             </button>
                             <button onClick={() => handleToolClick('vector')} className="flex items-center gap-1 px-3 py-1.5 hover:bg-gray-100 rounded-md transition-colors text-xs font-medium text-gray-600 whitespace-nowrap">
                                <Zap size={14} /> 转矢量
                             </button>
                             <button onClick={() => handleToolClick('layers')} className="flex items-center gap-1 px-3 py-1.5 hover:bg-gray-100 rounded-md transition-colors text-xs font-medium text-gray-600 whitespace-nowrap">
                                <Layers size={14} /> 图层
                             </button>
                             
                             <div className="w-px h-4 bg-gray-300 mx-1"></div>

                             <button 
                                onClick={() => setActiveTool('brush')}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors text-xs font-medium whitespace-nowrap ${activeTool === 'brush' ? 'bg-blue-50 text-blue-600 font-bold' : 'hover:bg-gray-100 text-gray-600'}`}
                             >
                                 <Eraser size={14} /> 涂抹
                             </button>
                             
                             <button 
                                onClick={() => setActiveTool('text')}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors text-xs font-medium whitespace-nowrap ${activeTool === 'text' ? 'bg-blue-50 text-blue-600 font-bold' : 'hover:bg-gray-100 text-gray-600'}`}
                             >
                                 <TypeIcon size={14} /> 改字
                             </button>

                             <button 
                                onClick={() => setIsEditing(false)} 
                                className="ml-2 p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-md"
                             >
                                 <X size={16} />
                             </button>
                        </div>
                    )}

                    {/* CONVERSATIONAL EDIT PROMPT BAR + MODEL SELECTOR */}
                    {currentImage && (
                        <div className="absolute bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 bg-[#1a1a1a]/95 backdrop-blur-md border border-[#333] rounded-2xl p-2 w-[90%] md:w-[600px] shadow-2xl animate-fade-in-up flex items-center gap-2 z-30 ring-1 ring-white/10">
                            
                            {/* Model Selector Dropdown */}
                            <div className="relative shrink-0 border-r border-[#333] pr-2 mr-1">
                                <select 
                                    value={editModel}
                                    onChange={(e) => setEditModel(e.target.value)}
                                    className="bg-transparent text-[10px] md:text-xs font-bold text-emerald-400 focus:outline-none appearance-none pr-4 cursor-pointer max-w-[100px] md:max-w-none"
                                >
                                    {EDIT_MODELS.map(m => (
                                        <option key={m.id} value={m.id} className="bg-[#1a1a1a] text-gray-300">
                                            {m.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>

                            <div className={`p-2 rounded-xl text-gray-300 shrink-0 transition-colors ${isEditing ? 'bg-blue-900/50 text-blue-400' : 'bg-[#333]'}`}>
                                {isEditing ? <Eraser size={18} /> : <MessageSquare size={18} />}
                            </div>
                            
                            <div className="flex-1 flex flex-col min-w-0">
                                <input 
                                    type="text"
                                    value={editPrompt}
                                    onChange={(e) => setEditPrompt(e.target.value)}
                                    placeholder={isEditing ? `使用 ${EDIT_MODELS.find(m=>m.id===editModel)?.name} 生成填充...` : "输入编辑指令 (例如: 变成夜晚, 添加下雨特效)..."}
                                    className="w-full bg-transparent border-none outline-none text-white text-sm placeholder-gray-500"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSubmitEdit()}
                                />
                            </div>
                            
                            <button 
                                onClick={handleSubmitEdit} 
                                className="px-3 md:px-4 py-2 bg-white text-black rounded-xl text-xs font-bold hover:bg-gray-200 flex items-center gap-2 transition-colors shrink-0"
                            >
                                <Sparkles size={14} className="text-purple-600" />
                                <span className="hidden sm:inline">{isEditing ? "生成填充" : "对话编辑"}</span>
                            </button>
                        </div>
                    )}
                    
                    {errorMsg && (
                        <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-red-900/80 text-white px-6 py-3 rounded-lg border border-red-500 backdrop-blur-md flex items-center gap-2 shadow-xl z-50 whitespace-nowrap">
                            <Trash2 size={16} /> {errorMsg}
                        </div>
                    )}
                </div>
            </div>

            {/* COLUMN 3: History Sidebar (Right on Desktop, Bottom on Mobile) */}
            <div className="w-full md:w-80 bg-[#0d0d0d] border-t md:border-t-0 md:border-l border-[#262626] flex flex-col shrink-0 md:h-full z-10 order-3 md:order-3 max-h-[300px] md:max-h-none">
                <div className="h-14 border-b border-[#262626] flex items-center px-6 gap-2 bg-[#141414]">
                    <Clock size={16} className="text-gray-400" />
                    <span className="text-sm font-bold text-white">历史记录 ({history.length})</span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {history.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-2 py-8 md:py-0">
                             <ImageIcon size={32} className="opacity-20" />
                             <span className="text-xs">暂无历史记录</span>
                        </div>
                    ) : (
                        history.map(img => (
                            <div 
                                key={img.id}
                                onClick={() => selectHistoryItem(img)}
                                className={`group bg-[#1a1a1a] rounded-xl overflow-hidden cursor-pointer border hover:border-emerald-500/50 transition-all relative ${currentImage?.id === img.id ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-[#333]'}`}
                            >
                                <div className="aspect-video relative bg-black">
                                    <img src={img.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="p-3">
                                    <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed mb-2">{img.prompt}</p>
                                    <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                                        <span>{new Date(img.timestamp).toLocaleTimeString()}</span>
                                        <button className="hover:text-white transition-colors"><Download size={12} /></button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>
    </div>
  );
};

export default ImageGenView;
