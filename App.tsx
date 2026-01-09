
import React, { useState, useEffect, useRef } from 'react';
import { Clapperboard, Sparkles, Users, MapPin, ArrowLeft, Settings, Download, Film, Image as ImageIcon, X, MonitorPlay, AlertCircle, User, BookOpen, RefreshCw, Upload, FileText, ChevronDown, ChevronUp, Palette, Home, Loader2, Zap, Crown } from 'lucide-react';
import { AppStep, StoryboardData, Shot, Character, AnalyzeOptions, ApiConfig, UserProfile, TrackType, AppConfig } from './types';
import * as GeminiService from './services/geminiService';
import * as StorageService from './services/storageService';
import * as AuthService from './services/authService';
import * as SystemService from './services/systemService';
import ShotCard from './components/ShotCard';
import CharacterLibrary from './components/CharacterLibrary';
import FullMovieView from './components/FullMovieView';
import VideoGenerationModal from './components/VideoGenerationModal';
import ApiConfigModal from './components/ApiConfigModal';
import AuthModal from './components/AuthModal';
import UserProfileModal from './components/UserProfileModal';
import HistoryModal from './components/HistoryModal'; 
import ComicGeneratorView from './components/ComicGeneratorView';
import VideoEditorView from './components/VideoEditorView';
import ImageGenView from './components/ImageGenView'; 
import VideoGenView from './components/VideoGenView'; 
import NovelWorkstationView from './components/NovelWorkstationView';
import SelfMediaCenterView from './components/SelfMediaCenterView';
import FancyLoader from './components/FancyLoader';
import HomeView from './components/HomeView';
import PaymentModal from './components/PaymentModal';

const DEFAULT_CONFIG: ApiConfig = {
    baseUrl: "https://grsai.dakka.com.cn",
    apiKey: process.env.API_KEY || "sk-2c1b373465af49908f55025433cac819",
    textModel: "gemini-3-pro-preview",
    imageModel: "gemini-3-pro-image-preview", 
    videoModel: "veo-3.1-fast-generate-preview",
    provider: 'gemini',
    enableBackend: false,
    backendUrl: "http://localhost:3000/api"
};

const STYLE_CATEGORIES: Record<string, string[]> = {
  '日本动漫': ['海贼王风格', '宫崎骏风格', '火影忍者', '新海诚风格', '战国武将风格', '忍者风格', '青年漫画风格', '少女漫画风格', '儿童向风格', '机甲风格', '校园风格', '推理悬疑风格', '恐怖惊悚风格', '神话传说风格', '禅意风格'],
  '中国动漫': ['新风都市', '水墨画风格', '国潮风格', '古风仙侠', '皮影戏风格', '木偶戏风格', '武侠风格', '修仙风格', '年画风格', '京剧脸谱风格', '玄幻风格', '神话风格'],
  '美国动漫': ['迪士尼经典风格', '皮克斯3D风格', '漫威动画风格'],
  '欧洲动漫': ['俄罗斯动画风格', '德国动画风格', '西班牙动画风格', '意大利动画风格', '法国动画风格', '比利时漫画风格', '匈牙利动画风格', '荷兰动画风格', '瑞士动画风格', '希腊动画风格'],
  '通用风格': ['写实风格', 'Q版风格', 'SD风格', '像素风格', '超现实主义风格', '摄影写实', '史诗级电影', '好莱坞大片', '胶片电影风', '黏土动画风', '二次元插画风', '3D电影效果', '仿真人电影']
};

const DEMO_SCRIPT = `
Title: The Neon Awakening
Genre: Cyberpunk / Sci-Fi

Scene 1:
Location: Neo-Tokyo Street - Night. Rain pours heavily, reflecting neon lights.
Character: Kaito (Detective, trench coat) stands watching a hologram.
Action: Kaito lights a cigarette. He looks up at the massive Arasaka tower.

Scene 2:
Location: Alleyway.
Action: A shadow moves quickly. Kaito turns around, hand on his holster.
`;

const DEMO_DATA: StoryboardData = {
  title: "The Neon Awakening / 霓虹觉醒",
  synopsis: "In a rain-slicked Neo-Tokyo, a burnt-out detective uncovers a conspiracy that threatens to rewrite human consciousness.",
  characters: [
    {
      id: "demo-c1",
      name: "Kaito",
      gender: "Male",
      age: "30s",
      subjectDescription: "Cyber-noir detective, worn trench coat, glowing cybernetic eye",
      visualPrompt: "Cyberpunk detective, male, 30s, wearing trench coat, rain, neon lights background, detailed face, cybernetic eye implant, cinematic lighting",
      imageUrl: "https://images.unsplash.com/photo-1535295972055-1c762f4483e5?w=500&q=80", // Cyberpunk male
      background: "Former police officer turned private investigator.",
      personality: "Cynical, determined, but haunted by his past.",
      coreProps: "Revolver, Holographic Scanner, Cigarettes"
    }
  ],
  scenes: [
    { location: "Neo-Tokyo Street", mood: "Cyberpunk Noir", timeOfDay: "Night", visualPrompt: "Futuristic city street at night, heavy rain, neon signs reflecting in puddles, towering skyscrapers, blue and pink lighting" }
  ],
  shots: [
    {
      id: 101,
      shotNumber: 1,
      contentZh: "霓虹闪烁的街道，大雨倾盆，积水反射着城市的倒影。",
      contentEn: "Wide shot of Neo-Tokyo street, heavy rain pouring, neon lights reflecting in puddles.",
      visualDescriptionZh: "赛博朋克城市全景，雨夜，霓虹灯光，电影质感",
      visualDescriptionEn: "Cyberpunk city panorama, rainy night, neon lights, cinematic texture",
      shotSize: "Wide Shot (全景)",
      cameraMovement: "Pan Right (右摇)",
      t2iPrompt: "电影级全景镜头，赛博朋克城市街道，夜晚，大雨，霓虹灯招牌，潮湿的沥青路面，倒影，大气雾感，8k分辨率",
      t2iPromptEn: "Cinematic wide shot, cyberpunk city street, night, heavy rain, neon signs, wet asphalt, reflection, atmospheric fog, 8k resolution",
      i2vPrompt: "摄像机在雨天的街道上缓慢右摇",
      i2vPromptEn: "Camera pans right slowly across the rainy street",
      t2vPrompt: "夜晚的赛博朋克城市街道，下着雨",
      t2vPromptEn: "Cyberpunk city street at night, rain falling",
      narrationZh: "这座城市从不睡觉...",
      narrationEn: "This city never sleeps...",
      audioPromptZh: "暴雨声，远处警笛声，低沉的合成器音效",
      audioPromptEn: "Heavy rain, distant sirens, low synth drone",
      duration: "4s",
      imageUrl: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=800&q=80" // Neon street
    }
  ]
};

const App: React.FC = () => {
  // Navigation State
  const [currentView, setCurrentView] = useState<'HOME' | 'STUDIO'>('HOME');

  const [step, setStep] = useState<AppStep>(AppStep.INPUT);
  const [inputText, setInputText] = useState('');
  const [data, setData] = useState<StoryboardData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressLog, setProgressLog] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // Loading Animation State
  const [loadingMessage, setLoadingMessage] = useState('正在初始化 AI 导演...');
  
  // Settings State
  const [mode, setMode] = useState<'divergent' | 'logic'>('divergent');
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [shotCountMode, setShotCountMode] = useState<'auto' | 'custom'>('auto');
  const [customShotCount, setCustomShotCount] = useState<number>(10);

  // Config State
  const [apiConfig, setApiConfig] = useState<ApiConfig>(DEFAULT_CONFIG);
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);

  // UI State for Dropdowns
  const [isRatioOpen, setIsRatioOpen] = useState(false);
  const [isStyleOpen, setIsStyleOpen] = useState(false); 
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const fileUploadRef = useRef<HTMLInputElement>(null);
  const styleDropdownRef = useRef<HTMLDivElement>(null);
  
  // Video Modal State
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [activeShotForVideo, setActiveShotForVideo] = useState<Shot | null>(null);
  const [activePrevShotImage, setActivePrevShotImage] = useState<string | null>(null);

  // User & Auth & Payment State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // History State
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Library State
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryCharacters, setLibraryCharacters] = useState<Character[]>([
      {
          id: '1',
          name: '王珂',
          gender: '女',
          age: '青年',
          tags: ['写实', '电影质感写实', '女仆主播', '活泼'],
          subjectDescription: '女仆主播，青年，活泼',
          background: 'Unknown',
          personality: '活泼',
          coreProps: '',
          visualPrompt: '18岁少女，黑色长卷发，穿着黑白蕾丝女仆装，精致的妆容，在书房背景中，柔和的光线，三视图，正面，侧面，全身',
          imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
      }
  ]);

  // New Selection States
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<string>('');

  // Quick Tags
  const aspectRatios = ['16:9', '9:16', '1:1', '4:3'];

  // State
  const [shots, setShots] = useState<Shot[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  
  // Lightbox State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Auth Check Helper
  const checkAuth = () => {
    if (currentUser) return true;
    if (!AuthService.isCertified()) {
        setShowAuthModal(true);
        return false;
    }
    return true;
  };

  // Payment Check Helper (Simulation)
  const checkVIP = () => {
      if (currentUser?.level === 'Demo' || !currentUser) {
          setShowPaymentModal(true);
          return false;
      }
      return true;
  };

  // Load Config and User on Mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('yesir_api_config');
    let configToUse = DEFAULT_CONFIG;

    if (savedConfig) {
        try {
            const parsed = JSON.parse(savedConfig);
            configToUse = { 
                ...DEFAULT_CONFIG, 
                ...parsed, 
                apiKey: parsed.apiKey || process.env.API_KEY || DEFAULT_CONFIG.apiKey 
            }; 
        } catch (e) {
            console.error("Failed to parse config", e);
            setShowConfigModal(true);
        }
    } else {
        setShowConfigModal(true);
    }
    
    setApiConfig(configToUse);
    GeminiService.setApiConfig(configToUse);
    setIsConfigLoaded(true);

    SystemService.getAppConfig().then(cfg => {
        setAppConfig(cfg);
        if (cfg.appName !== 'Yesir') {
            document.title = cfg.appName;
        }
    });

    const user = AuthService.getCurrentUser();
    if (user) {
        setCurrentUser(user);
    } else {
        const guestUser: UserProfile = {
            id: 'guest',
            username: 'Director',
            level: 'Demo',
            status: 'Active',
            avatar: 'https://api.dicebear.com/7.x/micah/svg?seed=Director'
        };
        setCurrentUser(guestUser);
    }
  }, []);
  
  useEffect(() => {
      let interval: any;
      if (step === AppStep.ANALYZING) {
          const messages = [
              "正在深度阅读剧本...",
              "分析角色性格与外貌特征...",
              "拆解剧情结构与节奏...",
              "构思分镜景别与运镜...",
              "生成 AI 绘画提示词...",
              "导演正在就位，准备开拍..."
          ];
          let i = 0;
          setLoadingMessage(messages[0]);
          interval = setInterval(() => {
              i = (i + 1) % messages.length;
              setLoadingMessage(messages[i]);
          }, 3000);
      }
      return () => clearInterval(interval);
  }, [step]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step, currentView]);

  useEffect(() => {
    if (selectedImage || showLibrary || showVideoModal || showConfigModal || showAuthModal || showProfileModal || showHistoryModal || isStyleOpen || showPaymentModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [selectedImage, showLibrary, showVideoModal, showConfigModal, showAuthModal, showProfileModal, showHistoryModal, isStyleOpen, showPaymentModal]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (window.innerWidth >= 768 && styleDropdownRef.current && !styleDropdownRef.current.contains(event.target as Node)) {
        setIsStyleOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveConfig = (newConfig: ApiConfig) => {
      setApiConfig(newConfig);
      GeminiService.setApiConfig(newConfig);
      localStorage.setItem('yesir_api_config', JSON.stringify(newConfig));
      setShowConfigModal(false);
      SystemService.getAppConfig().then(setAppConfig);
  };

  const handleExportPDF = async () => {
      const element = document.getElementById('printable-content');
      if (!element) return;

      setIsExporting(true);
      // @ts-ignore
      if (window.html2pdf) {
          const opt = {
              margin: 0.2,
              filename: `${data?.title || 'storyboard'}.pdf`,
              image: { type: 'jpeg', quality: 0.98 },
              html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#0a0a0a' },
              jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
          };
          
          try {
              // @ts-ignore
              await window.html2pdf().set(opt).from(element).save();
          } catch (e) {
              window.print();
          } finally {
              setIsExporting(false);
          }
      } else {
          window.print();
          setIsExporting(false);
      }
  };

  const handleLoadProject = (loadedData: StoryboardData) => {
      if (!checkAuth()) return;
      setData(loadedData);
      setShots(loadedData.shots);
      setCharacters(loadedData.characters);
      setStep(AppStep.RESULT);
      setCurrentView('STUDIO');
  };

  const handleRunDemo = async () => {
      if (!checkAuth()) return;
      setCurrentView('STUDIO');
      setStep(AppStep.INPUT);
      setInputText(DEMO_SCRIPT);
      setSelectedGenre('科幻');
      setSelectedStyle('写实风格');
      
      setIsAnalyzing(true);
      setErrorMsg(null);
      setStep(AppStep.ANALYZING);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      setLoadingMessage("正在加载演示数据...");
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setData(DEMO_DATA);
      setShots(DEMO_DATA.shots);
      setCharacters(DEMO_DATA.characters);
      setStep(AppStep.RESULT);
      setIsAnalyzing(false);
  };

  const handleLoginSuccess = (user: UserProfile) => {
      setCurrentUser(user);
  };

  const handleLogout = () => {
      AuthService.logout();
      setCurrentUser(null);
      setShowProfileModal(false);
      setShowAuthModal(true);
  };

  const handlePaymentSuccess = () => {
      if (currentUser) {
          const updatedUser = { ...currentUser, level: "Pro Director", isVip: true };
          setCurrentUser(updatedUser);
          localStorage.setItem('yesir_certified_user', JSON.stringify(updatedUser));
      }
  };

  const saveCurrentProjectState = (currentShots: Shot[], currentChars: Character[]) => {
      if (data) {
          const updatedData = { ...data, shots: currentShots, characters: currentChars };
          setData(updatedData); 
          StorageService.saveProject(updatedData);
      }
  };

  const updateShotState = (shotId: number, updates: Partial<Shot>) => {
      setShots(prev => {
          const updated = prev.map(s => s.id === shotId ? { ...s, ...updates } : s);
          if (updates.videoUrl || updates.error || updates.lastFrameImageUrl) {
              saveCurrentProjectState(updated, characters);
          }
          return updated;
      });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
              const content = event.target?.result as string;
              if (content) {
                  setInputText(prev => prev + '\n' + content);
              }
          };
          reader.readAsText(file);
          if (fileUploadRef.current) fileUploadRef.current.value = '';
      }
  };

  const handleAnalyze = async () => {
    if (!checkAuth()) return;
    if (!inputText.trim()) return;
    if (!apiConfig.apiKey && !process.env.API_KEY) {
        setShowConfigModal(true);
        return;
    }
    
    setIsAnalyzing(true);
    setErrorMsg(null);
    setStep(AppStep.ANALYZING);
    setProgressLog(lang === 'zh' ? '正在调用大模型分析剧本逻辑与一致性...' : 'Analyzing script structure and consistency...');

    const options: AnalyzeOptions = {
      genre: selectedGenre,
      style: selectedStyle,
      mode,
      lang,
      aspectRatio,
      shotCountMode,
      customShotCount: shotCountMode === 'custom' ? customShotCount : undefined,
      libraryCharacters: libraryCharacters
    };

    try {
      const result = await GeminiService.analyzeScript(inputText, options);
      if (!result || !result.shots) throw new Error("生成结果为空，请重试");

      setData(result);
      
      const initialShots = (result.shots || []).map((s, index) => {
          const fallbackPrompt = s.visualDescriptionZh || s.contentZh || "Cinematic shot, high quality";
          return {
            ...s,
            id: (s.id !== undefined && s.id !== null) ? s.id : (Date.now() + index),
            shotNumber: s.shotNumber || (index + 1),
            t2iPrompt: s.t2iPrompt || fallbackPrompt,
            t2iPromptEn: s.t2iPromptEn || s.t2iPrompt || fallbackPrompt,
            i2vPrompt: s.i2vPrompt || "Cinematic camera movement",
            i2vPromptEn: s.i2vPromptEn || "Cinematic camera movement",
            t2vPrompt: s.t2vPrompt || fallbackPrompt,
            t2vPromptEn: s.t2vPromptEn || fallbackPrompt,
            contentZh: s.contentZh || "",
            contentEn: s.contentEn || "",
            visualDescriptionZh: s.visualDescriptionZh || "",
            visualDescriptionEn: s.visualDescriptionEn || "",
            imageUrl: '',
            isGeneratingImage: true,
            videoUrl: '',
            isGeneratingVideo: false
          };
      });

      const enrichedShots = initialShots.map(shot => {
          let enhancedPrompt = shot.t2iPrompt;
          let enhancedPromptEn = shot.t2iPromptEn;
          const matchedChar = result.characters?.find(c => 
              shot.contentZh?.includes(c.name) || 
              shot.visualDescriptionZh?.includes(c.name) ||
              shot.narrationZh?.includes(c.name)
          );

          if (matchedChar && matchedChar.visualPrompt) {
              enhancedPrompt = `(角色: ${matchedChar.visualPrompt}), ` + enhancedPrompt;
              enhancedPromptEn = `(Character: ${matchedChar.visualPrompt}), ` + enhancedPromptEn;
          }

          return { ...shot, t2iPrompt: enhancedPrompt, t2iPromptEn: enhancedPromptEn };
      });

      setShots(enrichedShots);

      const initialCharacters = (result.characters || []).map((c, index) => {
         const libChar = libraryCharacters.find(lc => 
            c.name.includes(lc.name) || lc.name.includes(c.name)
         );
         
         const safeChar = {
             ...c,
             id: c.id || `char-${Date.now()}-${index}`,
             name: c.name || "Unknown",
             visualPrompt: c.visualPrompt || c.subjectDescription || "Character portrait"
         };

         if (libChar) {
             return {
                 ...safeChar,
                 id: libChar.id, 
                 name: libChar.name,
                 subjectDescription: libChar.subjectDescription,
                 visualPrompt: libChar.visualPrompt,
                 imageUrl: libChar.imageUrl || '',
                 isGeneratingImage: !libChar.imageUrl 
             };
         }

         return {
            ...safeChar,
            imageUrl: '',
            isGeneratingImage: true
         };
      });
      setCharacters(initialCharacters);
      
      setStep(AppStep.RESULT);
      StorageService.saveProject({ ...result, shots: enrichedShots, characters: initialCharacters });
      generateAllImages(enrichedShots);
      generateAllCharacterImages(initialCharacters);

    } catch (error: any) {
      console.error(error);
      let msg = error.message || '分析失败，请检查网络或重试。';
      if (msg.includes('403')) {
          msg = "API 余额不足 (403)。请在设置中更换 API Key 或切换服务商。";
          setShowConfigModal(true);
      }
      setErrorMsg(msg);
      setStep(AppStep.INPUT);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateAllImages = async (currentShots: Shot[]) => {
    for (const shot of currentShots) {
       if (!shot || shot.id === undefined || shot.id === null) continue;
       await generateSingleShotImage(shot.id, shot.t2iPrompt);
       await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const generateSingleShotImage = async (shotId: number, prompt: string, refImage?: string) => {
    if (!prompt) return;
    setShots(prev => prev.map(s => s.id === shotId ? { ...s, isGeneratingImage: true, error: undefined } : s));
    try {
      const base64Image = await GeminiService.generateImage(prompt, aspectRatio, undefined, 1, refImage);
      setShots(prev => {
          const updated = prev.map(s => s.id === shotId ? { ...s, imageUrl: base64Image, isGeneratingImage: false, error: undefined } : s);
          saveCurrentProjectState(updated, characters);
          return updated;
      });
    } catch (e: any) {
      setShots(prev => prev.map(s => s.id === shotId ? { ...s, isGeneratingImage: false, error: e.message } : s));
    }
  };

  const handleUseAsNextRef = (index: number) => {
      if (index >= shots.length - 1) return;
      const currentShot = shots[index];
      const nextShot = shots[index + 1];
      if (currentShot.imageUrl) {
          generateSingleShotImage(nextShot.id, nextShot.t2iPrompt, currentShot.imageUrl);
      }
  };

  const handleOpenVideoModal = (shotId: number) => {
    if (!checkVIP()) return;
    const index = shots.findIndex(s => s.id === shotId);
    const shot = shots[index];
    let prevImage: string | null = null;
    if (index > 0) {
        const prevShot = shots[index - 1];
        prevImage = prevShot.lastFrameImageUrl || prevShot.imageUrl || null;
    }
    if (shot) {
      setActiveShotForVideo(shot);
      setActivePrevShotImage(prevImage);
      setShowVideoModal(true);
    }
  };

  const handleNextVideoModal = () => {
    if (!activeShotForVideo) return;
    const currentIndex = shots.findIndex(s => s.id === activeShotForVideo.id);
    if (currentIndex >= 0 && currentIndex < shots.length - 1) {
        const nextShot = shots[currentIndex + 1];
        handleOpenVideoModal(nextShot.id);
    }
  };

  const hasNextShot = activeShotForVideo ? shots.findIndex(s => s.id === activeShotForVideo.id) < shots.length - 1 : false;

  const handleConfirmGenerateVideo = async (shotId: number, params: { prompt: string; firstFrameImage?: string; aspectRatio: string; model: string; lastFrameImage?: string; audioFile?: string; duration: number; subjectUrl?: string }) => {
    // @ts-ignore
    if (window.aistudio && (params.model.includes('veo') || params.model.includes('pro'))) {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
             // @ts-ignore
             await window.aistudio.openSelectKey();
        }
    }

    if (!apiConfig.apiKey && !process.env.API_KEY) {
        alert("API Key 未配置，请在设置中配置");
        setShowConfigModal(true);
        return;
    }

    setShots(prev => prev.map(s => s.id === shotId ? { ...s, isGeneratingVideo: true, generationProgress: 0, error: undefined, generationStatus: 'starting', audioFileUrl: params.audioFile } : s));
    
    try {
      const videoUrl = await GeminiService.generateVideo(
          params.prompt, 
          params.firstFrameImage, 
          params.aspectRatio,
          params.model,
          (progress, status) => {
             setShots(prev => prev.map(s => s.id === shotId ? { ...s, generationProgress: progress, generationStatus: status } : s));
          },
          params.lastFrameImage,
          params.duration,
          undefined,
          params.subjectUrl,
          params.audioFile
      );
      setShots(prev => {
          const updated = prev.map(s => s.id === shotId ? { ...s, videoUrl: videoUrl, isGeneratingVideo: false, generationProgress: undefined, generationStatus: undefined } : s);
          saveCurrentProjectState(updated, characters);
          return updated;
      });
    } catch (e: any) {
      setShots(prev => prev.map(s => s.id === shotId ? { ...s, isGeneratingVideo: false, generationProgress: undefined, error: e.message } : s));
      if (step !== AppStep.FULL_MOVIE) {
          alert(`视频生成失败: ${e.message}`);
      }
    }
  };

  const generateAllCharacterImages = async (currentChars: Character[]) => {
    for (let i = 0; i < currentChars.length; i++) {
        const char = currentChars[i];
        if (char.imageUrl) continue;
        try {
            const enhancedPrompt = `(人物三视图:1.5), (正面, 侧面, 背面), 全身展示, 角色设定图, ${char.visualPrompt}`;
            const base64Image = await GeminiService.generateImage(enhancedPrompt, "3:4");
            setCharacters(prev => {
                const newChars = [...prev];
                newChars[i] = { ...newChars[i], imageUrl: base64Image, isGeneratingImage: false, error: undefined };
                saveCurrentProjectState(shots, newChars);
                return newChars;
            });
        } catch (e: any) {
             setCharacters(prev => {
                const newChars = [...prev];
                newChars[i] = { ...newChars[i], isGeneratingImage: false, error: e.message };
                return newChars;
            });
        }
    }
  };

  const handleReset = () => {
    setStep(AppStep.INPUT);
    setData(null);
    setShots([]);
    setCharacters([]);
    setProgressLog('');
    setErrorMsg(null);
  };

  const handleSelectCharacters = (names: string[]) => {
    const textToInsert = names.map(name => `@${name}`).join(' ');
    setInputText(prev => prev + ' ' + textToInsert + ' ');
    setShowLibrary(false);
  };

  const handleEnterStudio = () => { if (!checkAuth()) return; setCurrentView('STUDIO'); setStep(AppStep.INPUT); };
  const handleEnterImageGen = () => { if (!checkAuth()) return; setCurrentView('STUDIO'); setStep(AppStep.IMAGE_GEN); };
  const handleEnterVideoGen = () => { if (!checkAuth()) return; setCurrentView('STUDIO'); setStep(AppStep.VIDEO_GEN); };
  const handleEnterNovelWorkstation = () => { if (!checkAuth()) return; setCurrentView('STUDIO'); setStep(AppStep.NOVEL_WORKSTATION); };
  const handleEnterSelfMediaCenter = () => { if (!checkAuth()) return; setCurrentView('STUDIO'); setStep(AppStep.SELF_MEDIA_CENTER); };

  return (
      <div className="font-geist text-white">
       
       {/* Global Modals */}
       <ApiConfigModal 
        isOpen={showConfigModal}
        initialConfig={apiConfig}
        onSave={handleSaveConfig}
        onClose={() => setShowConfigModal(false)}
      />
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
      <PaymentModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
      />
      {currentUser && (
          <UserProfileModal 
            isOpen={showProfileModal}
            onClose={() => setShowProfileModal(false)}
            user={currentUser}
            onLogout={handleLogout}
            onLoadProject={handleLoadProject}
          />
      )}
      <HistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        onLoad={handleLoadProject}
      />

      {/* --- HOME VIEW --- */}
      {currentView === 'HOME' && (
          <HomeView 
             onEnterStudio={handleEnterStudio} 
             onEnterImageGen={handleEnterImageGen}
             onEnterVideoGen={handleEnterVideoGen}
             onEnterNovelWorkstation={handleEnterNovelWorkstation}
             onEnterSelfMediaCenter={handleEnterSelfMediaCenter}
             onRunDemo={handleRunDemo} 
             userAvatar={currentUser?.avatar}
             userName={currentUser?.username}
             onOpenAuth={() => setShowAuthModal(true)}
             onOpenHistory={() => setShowHistoryModal(true)} 
             onOpenSettings={() => setShowConfigModal(true)} 
          />
      )}

      {/* --- STUDIO VIEW --- */}
      {currentView === 'STUDIO' && (
        <div className="min-h-screen bg-transparent text-[#e5e5e5] font-sans selection:bg-cinema-accent selection:text-black relative" id="app-root">
            
            {/* Studio-specific Modals */}
            {showLibrary && (
                <CharacterLibrary 
                    characters={libraryCharacters}
                    onUpdateCharacters={setLibraryCharacters}
                    onSelect={handleSelectCharacters}
                    onClose={() => setShowLibrary(false)}
                />
            )}

            <VideoGenerationModal 
                isOpen={showVideoModal}
                shot={activeShotForVideo}
                previousShotImage={activePrevShotImage}
                defaultAspectRatio={aspectRatio}
                onClose={() => setShowVideoModal(false)}
                onGenerate={handleConfirmGenerateVideo}
                onNext={handleNextVideoModal}
                hasNext={hasNextShot}
                characters={characters}
            />

            {selectedImage && !showLibrary && !showVideoModal && !showConfigModal && !showAuthModal && !showProfileModal && !showHistoryModal && !showPaymentModal && (
                <div 
                    className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-fade-in no-print"
                    onClick={() => setSelectedImage(null)}
                >
                    <button 
                        className="absolute top-6 right-6 text-white hover:text-cinema-accent transition-colors"
                        onClick={() => setSelectedImage(null)}
                    >
                        <X size={32} />
                    </button>
                    <img 
                        src={selectedImage} 
                        alt="Fullscreen" 
                        className="max-w-full max-h-full object-contain rounded-md shadow-2xl ring-1 ring-white/20"
                        onClick={(e) => e.stopPropagation()} 
                    />
                </div>
            )}

            {/* ANALYZING LOADING SCREEN */}
            {step === AppStep.ANALYZING && (
                <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col items-center justify-center animate-fade-in w-full h-full">
                    <FancyLoader type="analyzing" size="lg" />
                    <h2 className="text-2xl font-bold text-white mt-8 mb-2 tracking-widest uppercase">AI Director at Work</h2>
                    <p className="text-cinema-accent font-mono animate-pulse text-sm">
                        {loadingMessage}
                    </p>
                    <div className="mt-8 w-64 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cinema-accent to-purple-500 animate-loading-bar"></div>
                    </div>
                </div>
            )}

            {/* CONDITIONAL SUB-VIEWS WITHIN STUDIO */}
            {step === AppStep.FULL_MOVIE ? (
                <FullMovieView 
                    shots={shots} 
                    aspectRatio={aspectRatio}
                    onUpdateShot={updateShotState} 
                    onBack={() => setStep(AppStep.RESULT)}
                    onEdit={() => setStep(AppStep.EDITOR)}
                    characters={characters}
                    onRegenerateImage={generateSingleShotImage}
                />
            ) : step === AppStep.EDITOR ? (
                <VideoEditorView
                    initialResources={shots.map(s => {
                        const url = s.videoUrl || s.imageUrl;
                        if (!url) return null;
                        const durationSec = parseInt(s.duration) || 5;
                        return {
                            id: (s.id || Date.now()).toString(),
                            url: url,
                            type: TrackType.VIDEO,
                            name: `Scene ${s.shotNumber}`,
                            thumbnail: s.imageUrl,
                            isImage: !s.videoUrl,
                            duration: durationSec
                        };
                    }).filter(Boolean) as any[]}
                    onBack={() => setStep(AppStep.FULL_MOVIE)}
                />
            ) : step === AppStep.COMIC_GENERATOR ? (
                <ComicGeneratorView 
                    inputText={inputText}
                    storyboardData={data} 
                    onBack={() => setStep(AppStep.RESULT)} 
                />
            ) : step === AppStep.IMAGE_GEN ? (
                <ImageGenView 
                    onBack={() => setCurrentView('HOME')} 
                />
            ) : step === AppStep.VIDEO_GEN ? (
                <VideoGenView 
                    onBack={() => setCurrentView('HOME')} 
                />
            ) : step === AppStep.NOVEL_WORKSTATION ? (
                <NovelWorkstationView 
                    onBack={() => setCurrentView('HOME')} 
                    onGoToComic={(script) => {
                        setInputText(script);
                        setStep(AppStep.COMIC_GENERATOR);
                    }}
                />
            ) : step === AppStep.SELF_MEDIA_CENTER ? (
                <SelfMediaCenterView 
                    onBack={() => setCurrentView('HOME')}
                />
            ) : (
                /* DEFAULT STUDIO LAYOUT (Input / Result) */
                <>
                    {/* Floating Header for Studio */}
                    {step !== AppStep.ANALYZING && (
                        <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-black/20 border-b border-white/10 no-print">
                            <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                                <div className="flex items-center gap-3 cursor-pointer group" onClick={handleReset}>
                                    <div className="bg-white/10 p-1.5 rounded-lg border border-white/10 group-hover:border-white/30 transition-all">
                                        <Clapperboard size={20} className="text-white" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h1 className="text-lg md:text-xl font-bold tracking-tight leading-none text-white font-geist">
                                            {appConfig?.appName || "Yesir"}
                                        </h1>
                                        <span className="text-[10px] text-gray-400 tracking-wider">AI STORYBOARD</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 md:gap-4 text-sm font-medium">
                                    <button 
                                        onClick={() => setCurrentView('HOME')}
                                        className="flex items-center gap-2 hover:text-white transition-colors bg-white/5 border border-white/10 px-4 py-1.5 rounded-full hover:bg-white/10"
                                    >
                                        <Home size={14} /> <span className="hidden sm:inline">主页</span>
                                    </button>
                                    <button 
                                        onClick={() => setShowLibrary(true)}
                                        className="flex items-center gap-2 hover:text-white transition-colors text-gray-400 hover:bg-white/5 px-3 py-1.5 rounded-full"
                                    >
                                        <Users size={16} /> <span className="hidden sm:inline">角色库</span>
                                    </button>
                                    
                                    {currentUser?.isVip && (
                                        <div className="hidden sm:flex items-center gap-1 text-amber-400 text-xs font-bold border border-amber-500/30 px-2 py-1 rounded-full bg-amber-500/10">
                                            <Crown size={12} fill="currentColor"/> PRO
                                        </div>
                                    )}
                                </div>
                            </div>
                        </header>
                    )}

                    <main className={step === AppStep.ANALYZING ? "w-full h-screen" : "pt-24 pb-24 md:pb-40 px-4 md:px-6 max-w-[1400px] mx-auto"} id="printable-content">
                        
                        {step === AppStep.INPUT && (
                        <div className="animate-slide-up flex flex-col items-center">
                            
                            <div className="text-center mb-10 mt-8">
                                <h2 className="text-4xl md:text-6xl font-geist font-light text-white mb-4 tracking-tighter">
                                    AI 智能 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">分镜生成</span>
                                </h2>
                                <p className="text-gray-400 text-base md:text-lg font-light tracking-wide max-w-xl mx-auto">
                                    将您的剧本或想法，一键转化为包含画面、运镜、光影的专业分镜脚本。
                                </p>
                            </div>
                            
                            {/* Input Container */}
                            <div className="w-full max-w-4xl relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition duration-1000"></div>
                                <div className="relative bg-black/30 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 shadow-2xl min-h-[24rem] flex flex-col ring-1 ring-white/5">
                                    
                                    {/* Toolbar */}
                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-white/5 pb-4">
                                        <div className="flex gap-2">
                                            <div className="flex bg-white/5 rounded-lg p-1 border border-white/5">
                                                <button onClick={() => setMode('divergent')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${mode === 'divergent' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>创意模式</button>
                                                <button onClick={() => setMode('logic')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${mode === 'logic' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>严谨模式</button>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            <div className="relative">
                                                <button onClick={() => setIsRatioOpen(!isRatioOpen)} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white transition-all">
                                                    <MonitorPlay size={12} /> {aspectRatio}
                                                </button>
                                                {isRatioOpen && (
                                                    <div className="absolute top-full right-0 mt-1 w-24 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50 py-1">
                                                        {aspectRatios.map(r => (
                                                            <button key={r} onClick={() => { setAspectRatio(r); setIsRatioOpen(false); }} className={`w-full px-3 py-1.5 text-xs text-left hover:bg-white/5 ${aspectRatio === r ? 'text-blue-400' : 'text-gray-400'}`}>{r}</button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Text Area */}
                                    <textarea
                                        ref={textAreaRef}
                                        className="w-full flex-1 bg-transparent text-base md:text-lg text-gray-200 placeholder-gray-600 focus:outline-none resize-none font-light leading-relaxed"
                                        placeholder="在此输入您的小说片段、剧本大纲或创意想法..."
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                    />

                                    {/* Footer Tools */}
                                    <div className="flex items-center justify-between pt-4 mt-auto border-t border-white/5">
                                        <div className="flex gap-2">
                                            <input type="file" ref={fileUploadRef} className="hidden" accept=".txt,.md,.json,.csv" onChange={handleFileUpload} />
                                            <button onClick={() => fileUploadRef.current?.click()} className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/5">
                                                <Upload size={14} /> 导入文件
                                            </button>
                                            <button onClick={() => setShowLibrary(true)} className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/5">
                                                <Users size={14} /> 角色库 ({libraryCharacters.length})
                                            </button>
                                            
                                            {/* Style Dropdown */}
                                            <div className="relative" ref={styleDropdownRef}>
                                                <button 
                                                    onClick={() => setIsStyleOpen(!isStyleOpen)} 
                                                    className={`flex items-center gap-2 text-xs transition-colors px-2 py-1 rounded hover:bg-white/10 ${selectedStyle ? 'text-cinema-accent font-bold' : 'text-gray-400 hover:text-white'}`}
                                                >
                                                    <Palette size={14} /> 
                                                    <span className="truncate max-w-[80px]">{selectedStyle || '画风类型'}</span>
                                                </button>
                                                {isStyleOpen && (
                                                    <div className="absolute bottom-full left-0 mb-2 w-64 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 flex flex-col max-h-[400px] overflow-hidden animate-fade-in custom-scrollbar">
                                                         <div className="overflow-y-auto p-2 space-y-3">
                                                            {Object.entries(STYLE_CATEGORIES).map(([category, styles]) => (
                                                                <div key={category}>
                                                                    <div className="text-[10px] text-gray-500 font-bold px-2 mb-1.5 uppercase tracking-wider sticky top-0 bg-black/50 backdrop-blur-md py-1">{category}</div>
                                                                    <div className="grid grid-cols-2 gap-1">
                                                                        {styles.map(s => (
                                                                            <button 
                                                                                key={s} 
                                                                                onClick={() => { setSelectedStyle(s); setIsStyleOpen(false); }}
                                                                                className={`text-left px-2 py-1.5 rounded text-[10px] truncate transition-colors ${selectedStyle === s ? 'bg-cinema-accent text-black font-bold' : 'text-gray-300 hover:bg-white/10'}`}
                                                                                title={s}
                                                                            >
                                                                                {s}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                         </div>
                                                         <div className="p-2 border-t border-white/10 bg-black/50 backdrop-blur-md">
                                                             <button onClick={() => { setSelectedStyle(''); setIsStyleOpen(false); }} className="w-full text-center text-[10px] text-gray-500 hover:text-white py-1 transition-colors">清除选择</button>
                                                         </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-600 font-mono">{inputText.length} 字</div>
                                    </div>
                                </div>
                            </div>

                            {/* Main Action Button */}
                            <div className="mt-8">
                                <button
                                    onClick={handleAnalyze}
                                    disabled={!inputText.trim()}
                                    className="group relative inline-flex items-center justify-center px-8 py-4 font-semibold text-white transition-all duration-200 bg-white text-black rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                                >
                                    <span className="text-black">生成分镜脚本</span>
                                    <Sparkles className="w-4 h-4 ml-2 text-black" />
                                </button>
                            </div>

                        </div>
                        )}

                        {/* Result View */}
                        {step === AppStep.RESULT && data && (
                        <div className="animate-slide-up">
                            <div className="flex items-center justify-between mb-8 no-print">
                                <button onClick={handleReset} className="text-gray-400 hover:text-white flex items-center gap-2 text-sm transition-colors px-4 py-2 rounded-full hover:bg-white/5">
                                    <ArrowLeft size={16} /> 返回编辑
                                </button>
                                <div className="flex gap-2 md:gap-3">
                                    <button onClick={() => setStep(AppStep.COMIC_GENERATOR)} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs md:text-sm text-pink-300 hover:text-white hover:border-pink-500/50 transition-colors backdrop-blur-md">
                                        <BookOpen size={16} /> 转漫画
                                    </button>
                                    <button onClick={handleExportPDF} disabled={isExporting} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs md:text-sm text-gray-300 hover:text-white hover:border-white/30 transition-colors backdrop-blur-md">
                                        {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} 导出 PDF
                                    </button>
                                    <button onClick={() => setStep(AppStep.FULL_MOVIE)} className="flex items-center gap-2 px-4 py-2 bg-white text-black font-bold rounded-full text-xs md:text-sm hover:bg-gray-200 transition-colors shadow-lg">
                                        <Film size={16} /> 生成全片
                                    </button>
                                </div>
                            </div>

                            {/* Title Section */}
                            <div className="mb-12 text-center">
                                <h1 className="text-4xl md:text-6xl font-light font-geist text-white mb-4 tracking-tighter">{data.title}</h1>
                                <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed text-lg font-light italic">"{data.synopsis}"</p>
                            </div>

                            {/* Grid Layout */}
                            <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-8 print-break-inside-avoid">
                                {/* Cast Card */}
                                <div className="bg-[#121212]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
                                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                                        <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400"><Users size={20} /></div>
                                        <h2 className="text-lg font-bold tracking-wide text-white">演员表 (Cast)</h2>
                                    </div>
                                    <div className="space-y-4">
                                        {characters.map((char, idx) => (
                                            <div key={idx} className="flex gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => char.imageUrl && setSelectedImage(char.imageUrl)}>
                                                <div className="w-16 h-16 rounded-xl bg-black/50 overflow-hidden border border-white/10 shrink-0">
                                                    {char.imageUrl ? <img src={char.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-700"><User size={20}/></div>}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-white font-bold">{char.name}</h3>
                                                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">{char.subjectDescription}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Scene Card */}
                                <div className="bg-[#121212]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
                                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                                        <div className="bg-purple-500/20 p-2 rounded-lg text-purple-400"><MapPin size={20} /></div>
                                        <h2 className="text-lg font-bold tracking-wide text-white">场景表 (Scenes)</h2>
                                    </div>
                                    <div className="space-y-4">
                                        {data.scenes.map((scene, idx) => (
                                            <div key={idx} className="p-4 rounded-2xl bg-black/20 border border-white/5 hover:border-white/10 transition-colors">
                                                <div className="flex justify-between mb-2">
                                                    <h3 className="font-bold text-gray-200">{scene.location}</h3>
                                                    <div className="flex gap-2">
                                                        <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-gray-400">{scene.timeOfDay}</span>
                                                        <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-gray-400">{scene.mood}</span>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-500 font-mono line-clamp-2">{scene.visualPrompt}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Shots List */}
                            <div>
                                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/10">
                                    <div className="bg-amber-500/20 p-2 rounded-lg text-amber-400"><Film size={20} /></div>
                                    <h2 className="text-2xl font-bold text-white tracking-tight">分镜序列 (Storyboard)</h2>
                                    <span className="ml-auto text-sm text-gray-500 font-mono border border-white/10 px-3 py-1 rounded-full">{shots.length} 镜头</span>
                                </div>

                                <div className="space-y-4">
                                    {shots.map((shot, index) => (
                                        <div key={shot.id} className="print-break-inside-avoid">
                                            <ShotCard 
                                                shot={shot} 
                                                onRegenerateImage={generateSingleShotImage}
                                                onGenerateVideo={(id) => handleOpenVideoModal(id)} 
                                                onImageClick={(url) => setSelectedImage(url)} 
                                                onUpdateShot={updateShotState}
                                                onUseAsNextRef={index < shots.length - 1 ? () => handleUseAsNextRef(index) : undefined}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        )}

                    </main>
                </>
            )}
        </div>
      )}
      </div>
  );
};

export default App;
