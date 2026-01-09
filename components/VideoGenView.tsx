
// ... existing imports ...
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Video, Wand2, Upload, Download, Trash2, Zap, Settings2, Sparkles, Image as ImageIcon, Clapperboard, Clock, Play, Pause, Film, FileVideo, History, RotateCcw, Plus, Lock, Server } from 'lucide-react';
import * as GeminiService from '../services/geminiService';
import * as AuthService from '../services/authService';
import FancyLoader from './FancyLoader';
import { BackendModel } from '../types';
import VideoEditModal from './VideoEditModal';

// ... interfaces ...
interface VideoGenViewProps {
  onBack: () => void;
}

interface GenerationParams {
    mode: 'text2video' | 'img2video' | 'multimodal';
    prompt: string;
    model: string;
    aspectRatio: string;
    duration: number;
    firstFrame: string | null;
    lastFrame: string | null;
    sourceVideo: string | null;
    subjectImage: string | null;
}

interface GeneratedVideo {
    id: string;
    url: string;
    timestamp: number;
    params: GenerationParams;
}

const CAMERA_MOVEMENTS = [
  { label: '推镜头 (Push In)', value: 'Camera pushes in slowly' },
  { label: '拉镜头 (Pull Out)', value: 'Camera pulls out' },
  { label: '左摇 (Pan Left)', value: 'Pan left' },
  { label: '右摇 (Pan Right)', value: 'Pan right' },
  { label: '上摇 (Tilt Up)', value: 'Tilt up' },
  { label: '环绕 (Orbit)', value: 'Orbit shot' },
  { label: '跟拍 (Tracking)', value: 'Tracking shot' },
  { label: '手持 (Handheld)', value: 'Handheld camera movement' },
];

const SHOT_SIZES = [
  { label: '大远景 (Extreme Wide)', value: 'Extreme wide shot' },
  { label: '全景 (Wide)', value: 'Wide shot' },
  { label: '中景 (Medium)', value: 'Medium shot' },
  { label: '特写 (Close-up)', value: 'Close-up' },
  { label: '微距 (Macro)', value: 'Macro lens details' },
];

const VideoGenView: React.FC<VideoGenViewProps> = ({ onBack }) => {
  // Config State
  const [mode, setMode] = useState<'text2video' | 'img2video' | 'multimodal'>('multimodal');
  const [prompt, setPrompt] = useState('赛博朋克霓虹城市，电影级光照，高质量，雨夜');
  
  // Model State
  const [model, setModel] = useState(GeminiService.getApiConfig().videoModel || 'veo-3.1-fast-generate-preview');
  const [availableModels, setAvailableModels] = useState<BackendModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [duration, setDuration] = useState(5);
  
  // ... rest of state (firstFrame, lastFrame, etc) ...
  const [firstFrame, setFirstFrame] = useState<string | null>(null);
  const [lastFrame, setLastFrame] = useState<string | null>(null);
  const [sourceVideo, setSourceVideo] = useState<string | null>("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"); // Demo
  const [subjectImage, setSubjectImage] = useState<string | null>("https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&q=80"); // Demo
  
  const [history, setHistory] = useState<GeneratedVideo[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<GeneratedVideo | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  const [showEditModal, setShowEditModal] = useState(false);

  const firstFrameInputRef = useRef<HTMLInputElement>(null);
  const lastFrameInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Fetch Models
  useEffect(() => {
      const loadModels = async () => {
          setIsLoadingModels(true);
          const models = await GeminiService.fetchAvailableModels();
          if (models.length > 0) {
              setAvailableModels(models);
              if (!models.find(m => m.id === model)) {
                  setModel(models[0].id);
              }
          }
          setIsLoadingModels(false);
      };
      
      const config = GeminiService.getApiConfig();
      if (config.enableBackend) {
          loadModels();
      }
  }, []);

  // Mode switch
  useEffect(() => {
      if (mode === 'multimodal') {
          const kling = availableModels.find(m => m.id.includes('kling'));
          if (kling && !kling.isLocked) setModel(kling.id);
          else setModel('kling-video-o1'); // Fallback
      }
  }, [mode, availableModels]);

  // ... handleGenerate, uploads, play logic (same as before) ...
  const handleGenerate = async () => {
      if (!prompt.trim()) return;
      
      const selectedBackendModel = availableModels.find(m => m.id === model);
      if (selectedBackendModel?.isLocked) {
          alert("您当前会员等级无法使用此模型，请升级套餐。");
          return;
      }

      if (mode === 'img2video' && !firstFrame) {
          setErrorMsg("图生视频模式必须上传参考图 (First Frame)");
          return;
      }
      if (mode === 'multimodal' && !sourceVideo) {
          setErrorMsg("多模态编辑必须上传原视频素材 (Source Video)");
          return;
      }

      setIsGenerating(true);
      setErrorMsg(null);
      setProgress(0);
      setStatus('Queued');
      
      try {
          const videoUrl = await GeminiService.generateVideo(
              prompt, 
              (mode === 'img2video' || mode === 'multimodal') ? (firstFrame || undefined) : undefined,
              aspectRatio, 
              model,
              (prog, stat) => {
                  setProgress(prog);
                  setStatus(stat);
              },
              lastFrame || undefined,
              duration,
              sourceVideo || undefined,
              subjectImage || undefined
          );
          
          const params: GenerationParams = {
              mode,
              prompt,
              model,
              aspectRatio,
              duration,
              firstFrame,
              lastFrame,
              sourceVideo,
              subjectImage
          };

          const newVideo: GeneratedVideo = {
              id: Date.now().toString(),
              url: videoUrl,
              timestamp: Date.now(),
              params
          };
          
          setCurrentVideo(newVideo);
          setHistory(prev => [newVideo, ...prev]);

      } catch (e: any) {
          let msg = e.message || "生成失败";
          if (msg.includes('403') || msg.includes('额度不足') || msg.includes('balance') || msg.includes('Quota')) {
             msg = "API 余额不足 (403)。请检查设置或更换 Key。";
          }
          setErrorMsg(msg);
      } finally {
          setIsGenerating(false);
      }
  };

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>, type: 'first' | 'last' | 'subject') => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              if (type === 'first') setFirstFrame(reader.result as string);
              else if (type === 'last') setLastFrame(reader.result as string);
              else if (type === 'subject') setSubjectImage(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleUploadVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setSourceVideo(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const selectHistoryItem = (item: GeneratedVideo) => {
      setCurrentVideo(item);
      setIsPlaying(false);
  };

  const restoreParameters = (item: GeneratedVideo) => {
      const p = item.params;
      setMode(p.mode);
      setPrompt(p.prompt);
      setModel(p.model);
      setAspectRatio(p.aspectRatio);
      setDuration(p.duration);
      setFirstFrame(p.firstFrame);
      setLastFrame(p.lastFrame);
      setSourceVideo(p.sourceVideo);
      setSubjectImage(p.subjectImage);
      setCurrentVideo(item);
  };

  const togglePlay = () => {
      if (videoRef.current) {
          if (isPlaying) videoRef.current.pause();
          else videoRef.current.play();
          setIsPlaying(!isPlaying);
      }
  };

  const addTagToPrompt = (tag: string) => {
      setPrompt(prev => {
          const clean = prev.trim();
          if (clean.includes(tag)) return clean;
          return clean ? `${clean}, ${tag}` : tag;
      });
  };

  const handleEditVideo = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowEditModal(true);
      setIsPlaying(false);
  };

  const handleEditSuccess = (newUrl: string) => {
      if (!currentVideo) return;
      const newVideo: GeneratedVideo = {
          id: Date.now().toString(),
          url: newUrl,
          timestamp: Date.now(),
          params: {
              ...currentVideo.params,
              mode: 'multimodal',
              prompt: "Edited: " + currentVideo.params.prompt,
              sourceVideo: currentVideo.url
          }
      };
      setCurrentVideo(newVideo);
      setHistory(prev => [newVideo, ...prev]);
  };

  // ... render ...
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col animate-fade-in">
        
        {/* ... Modal and Header ... */}
        {showEditModal && currentVideo && (
            <VideoEditModal 
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                sourceVideoUrl={currentVideo.url}
                onSuccess={handleEditSuccess}
            />
        )}

        <div className="h-16 border-b border-[#262626] bg-[#141414] px-4 md:px-6 flex items-center justify-between shrink-0 sticky top-0 z-50">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <Video className="text-rose-500" /> <span className="hidden sm:inline">神笔马良 · </span>视频生成
                </h2>
            </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
            {/* COLUMN 1: Config */}
            <div className="w-full md:w-96 bg-[#111] border-b md:border-b-0 md:border-r border-[#262626] flex flex-col p-4 md:p-6 overflow-y-auto custom-scrollbar md:h-full shrink-0 z-10 order-2 md:order-1">
                {/* Tabs, Prompt, Uploads */}
                <div className="flex bg-[#1a1a1a] p-1 rounded-lg mb-6 border border-[#333]">
                    <button 
                        onClick={() => setMode('text2video')}
                        className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-md transition-all ${mode === 'text2video' ? 'bg-[#333] text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        文生视频
                    </button>
                    <button 
                         onClick={() => setMode('img2video')}
                         className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-md transition-all ${mode === 'img2video' ? 'bg-[#333] text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        图生视频
                    </button>
                    <button 
                         onClick={() => setMode('multimodal')}
                         className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1 ${mode === 'multimodal' ? 'bg-[#333] text-rose-400 shadow' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        多模态编辑
                    </button>
                </div>

                {/* Prompt Section */}
                <div className="mb-6 space-y-2 relative">
                    <label className="text-sm font-bold text-gray-300 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clapperboard size={14} className="text-rose-500" />
                            视频创意 (Prompt)
                        </div>
                    </label>
                    <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full h-24 bg-[#1a1a1a] border border-[#333] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-rose-500 resize-none placeholder-gray-600 leading-relaxed"
                        placeholder="描述视频内容..."
                    />
                    {/* ... Director Console (same as before) ... */}
                    <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-3 space-y-3">
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-bold uppercase tracking-wider">
                            <Settings2 size={10} /> AI 导演控制台
                        </div>
                        <div className="space-y-2">
                            <div className="flex flex-wrap gap-1.5">
                                <span className="text-[10px] text-gray-600 mr-1 self-center">运镜:</span>
                                {CAMERA_MOVEMENTS.map(m => (
                                    <button key={m.label} onClick={() => addTagToPrompt(m.value)} className="text-[10px] px-2 py-1 bg-[#222] border border-[#333] rounded hover:border-rose-500 hover:text-rose-400 transition-colors" title={m.value}>{m.label}</button>
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                <span className="text-[10px] text-gray-600 mr-1 self-center">景别:</span>
                                {SHOT_SIZES.map(s => (
                                    <button key={s.label} onClick={() => addTagToPrompt(s.value)} className="text-[10px] px-2 py-1 bg-[#222] border border-[#333] rounded hover:border-blue-500 hover:text-blue-400 transition-colors" title={s.value}>{s.label}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upload Sections (Same as before) */}
                {mode === 'multimodal' && (
                    <div className="mb-6 grid grid-cols-3 gap-2">
                        <div 
                            className="aspect-square bg-[#1a1a1a] border-2 border-dashed border-[#333] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-rose-500/50 hover:bg-[#222] transition-all relative overflow-hidden group"
                            onClick={() => videoInputRef.current?.click()}
                        >
                            {sourceVideo ? (
                                <>
                                    <video src={sourceVideo} className="w-full h-full object-cover opacity-60" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-[10px]">更换</div>
                                </>
                            ) : (
                                <>
                                    <FileVideo className="text-gray-500 mb-1" size={20} />
                                    <span className="text-[10px] text-gray-500 font-bold">视频(必填)</span>
                                    <span className="text-[8px] text-gray-600">3-10s</span>
                                </>
                            )}
                            <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={handleUploadVideo} />
                        </div>
                        {/* ... Image/Subject Uploads ... */}
                        <div 
                            className="aspect-square bg-[#1a1a1a] border border-dashed border-[#333] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-gray-500 hover:bg-[#222] transition-all relative overflow-hidden"
                            onClick={() => firstFrameInputRef.current?.click()}
                        >
                            {firstFrame ? <img src={firstFrame} className="w-full h-full object-cover" /> : <><ImageIcon className="text-gray-500 mb-1" size={20} /><span className="text-[10px] text-gray-500">图片</span></>}
                            <input type="file" ref={firstFrameInputRef} className="hidden" accept="image/*" onChange={(e) => handleUploadImage(e, 'first')} />
                        </div>
                        <div 
                            className="aspect-square bg-[#1a1a1a] border border-dashed border-[#333] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-gray-500 hover:bg-[#222] transition-all relative overflow-hidden"
                            onClick={() => subjectInputRef.current?.click()}
                        >
                            {subjectImage ? <img src={subjectImage} className="w-full h-full object-cover" /> : <><Upload className="text-gray-500 mb-1" size={20} /><span className="text-[10px] text-gray-500">主体</span></>}
                            <input type="file" ref={subjectInputRef} className="hidden" accept="image/*" onChange={(e) => handleUploadImage(e, 'subject')} />
                        </div>
                    </div>
                )}

                {/* Settings with Fallback Buttons */}
                <div className="mb-6 space-y-4">
                     <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-300 flex items-center gap-2">
                            <Settings2 size={14} className="text-yellow-500" />
                            生成模型 (Model)
                        </label>
                        
                        {availableModels.length > 0 ? (
                            <div className="grid grid-cols-1 gap-2">
                                {availableModels.map(m => (
                                    <button 
                                        key={m.id}
                                        onClick={() => setModel(m.id)}
                                        disabled={m.isLocked}
                                        className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs text-left transition-all ${
                                            model === m.id 
                                            ? 'bg-rose-500/20 border-rose-500 text-rose-400' 
                                            : 'bg-[#1a1a1a] border-[#333] text-gray-400 hover:bg-[#222]'
                                        } ${m.isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {m.isLocked ? <Lock size={12} /> : <Server size={12} />}
                                            {m.name}
                                        </div>
                                        {m.isLocked && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-1 rounded">VIP</span>}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            // Fallback Local Mode
                            <>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={model}
                                        onChange={(e) => setModel(e.target.value)}
                                        className={`w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 font-mono ${mode === 'multimodal' ? 'text-rose-400 font-bold' : ''}`}
                                    />
                                    <div className="absolute right-2 top-2 text-[10px] text-gray-500 pointer-events-none">
                                        Local Mode
                                    </div>
                                </div>
                                {mode !== 'multimodal' && (
                                    <div className="grid grid-cols-3 gap-2">
                                        <button onClick={() => setModel('veo-3.1-fast-generate-preview')} className="text-[9px] bg-[#222] py-1.5 rounded text-gray-400 hover:text-white border border-transparent hover:border-rose-500/50 transition-all">Veo Fast</button>
                                        <button onClick={() => setModel('sora-2-pro-all')} className="text-[9px] bg-[#222] py-1.5 rounded text-gray-400 hover:text-white border border-transparent hover:border-rose-500/50 transition-all">Sora 2</button>
                                        <button onClick={() => setModel('wan2.6-i2v')} className="text-[9px] bg-[#222] py-1.5 rounded text-gray-400 hover:text-white border border-transparent hover:border-rose-500/50 transition-all">Wan 2.6</button>
                                        <button onClick={() => setModel('MiniMax-Hailuo-2.3-Fast')} className="text-[9px] bg-[#222] py-1.5 rounded text-gray-400 hover:text-white border border-transparent hover:border-rose-500/50 transition-all">Hailuo 2.3</button>
                                        <button onClick={() => setModel('jimeng-video-3.0')} className="text-[9px] bg-[#222] py-1.5 rounded text-gray-400 hover:text-white border border-transparent hover:border-rose-500/50 transition-all">Jimeng 3.0</button>
                                        <button onClick={() => setModel('kling-video')} className="text-[9px] bg-[#222] py-1.5 rounded text-gray-400 hover:text-white border border-transparent hover:border-rose-500/50 transition-all">Kling</button>
                                    </div>
                                )}
                            </>
                        )}
                        
                    </div>
                    {/* ... Aspect Ratio & Duration (Same as before) ... */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-300">比例</label>
                            <div className="flex flex-col gap-2">
                                <button onClick={() => setAspectRatio('16:9')} className={`w-full py-1.5 rounded-lg text-xs font-bold border transition-colors ${aspectRatio === '16:9' ? 'bg-rose-600 text-white border-rose-600' : 'bg-[#1a1a1a] border-[#333] text-gray-500 hover:border-gray-500'}`}>16:9 横屏</button>
                                <button onClick={() => setAspectRatio('9:16')} className={`w-full py-1.5 rounded-lg text-xs font-bold border transition-colors ${aspectRatio === '9:16' ? 'bg-rose-600 text-white border-rose-600' : 'bg-[#1a1a1a] border-[#333] text-gray-500 hover:border-gray-500'}`}>9:16 竖屏</button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-300">时长</label>
                            <div className="flex flex-col gap-2">
                                <button onClick={() => setDuration(5)} className={`w-full py-1.5 rounded-lg text-xs font-bold border transition-colors ${duration === 5 ? 'bg-rose-600 text-white border-rose-600' : 'bg-[#1a1a1a] border-[#333] text-gray-500 hover:border-gray-500'}`}>5 秒</button>
                                <button onClick={() => setDuration(10)} className={`w-full py-1.5 rounded-lg text-xs font-bold border transition-colors ${duration === 10 ? 'bg-rose-600 text-white border-rose-600' : 'bg-[#1a1a1a] border-[#333] text-gray-500 hover:border-gray-500'}`}>10 秒</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 mt-auto pt-6 border-t border-[#262626]">
                    <button 
                        onClick={handleGenerate}
                        disabled={isGenerating || !prompt.trim() || (mode === 'img2video' && !firstFrame) || (mode === 'multimodal' && !sourceVideo)}
                        className={`w-full py-3.5 font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${
                            mode === 'multimodal' 
                            ? 'bg-gradient-to-r from-rose-600 to-purple-600 text-white shadow-rose-600/20'
                            : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                        }`}
                    >
                        {isGenerating ? <Clock className="animate-spin" /> : <Wand2 />}
                        {isGenerating ? "生成中..." : (mode === 'multimodal' ? "开始多模态编辑" : "开始生成视频")}
                    </button>
                </div>
            </div>

            {/* COLUMN 2 & 3: Preview and History (Kept same) */}
            <div className="flex-1 bg-[#0a0a0a] flex flex-col relative overflow-hidden order-1 md:order-2 min-h-[400px] md:min-h-0">
                <div className="flex-1 flex items-center justify-center p-4 md:p-8 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] relative overflow-hidden">
                    {currentVideo ? (
                        <div className="relative shadow-2xl rounded-xl overflow-hidden border border-[#333] group max-h-full max-w-full inline-block bg-black animate-fade-in-up">
                             <video 
                                ref={videoRef}
                                src={currentVideo.url} 
                                className="max-w-full max-h-[50vh] md:max-h-[80vh] object-contain block" 
                                controls={false}
                                loop
                                onClick={togglePlay}
                             />
                             {!isPlaying && (
                                 <div className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer group-hover:bg-black/40 transition-colors" onClick={togglePlay}>
                                     <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/50 text-white shadow-2xl hover:scale-110 transition-transform">
                                         <Play size={40} fill="currentColor" className="ml-1" />
                                     </div>
                                 </div>
                             )}
                             <div className="absolute top-4 right-4 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-20">
                                <button onClick={handleEditVideo} className="p-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-500 backdrop-blur-sm transition-transform hover:scale-105 shadow-lg flex items-center gap-2">
                                    <Sparkles size={20} /> <span className="text-xs font-bold hidden sm:inline">AI 编辑</span>
                                </button>
                                <a href={currentVideo.url} download={`video-${currentVideo.id}.mp4`} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-black/60 text-white rounded-lg hover:bg-black/80 backdrop-blur-sm transition-transform hover:scale-105" onClick={(e) => e.stopPropagation()}>
                                    <Download size={20} />
                                </a>
                             </div>
                        </div>
                    ) : isGenerating ? (
                        <div className="flex flex-col items-center gap-6">
                            <FancyLoader type="video" size="lg" text={status || "AI IS DREAMING..."} />
                            <div className="w-80 space-y-2">
                                <div className="h-1.5 bg-[#333] rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-rose-500 to-orange-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                                </div>
                                <div className="flex justify-between text-xs font-mono text-gray-500">
                                    <span>{status}</span>
                                    <span>{progress}%</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-600 flex flex-col items-center gap-4 opacity-50">
                            <div className="w-32 h-32 bg-[#111] rounded-3xl flex items-center justify-center border border-[#222]">
                                <Film size={64} className="opacity-20" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-500">预览区域</h3>
                                <p className="text-sm mt-1">配置左侧参数并点击生成</p>
                            </div>
                        </div>
                    )}
                    {errorMsg && (
                        <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-red-900/80 text-white px-8 py-4 rounded-xl border border-red-500/50 backdrop-blur-md flex items-center gap-3 shadow-2xl z-50 whitespace-nowrap">
                            <div className="bg-red-500/20 p-1 rounded-full"><Trash2 size={20} className="text-red-400"/></div>
                            <div>
                                <h4 className="font-bold text-sm">生成失败</h4>
                                <p className="text-xs text-red-200">{errorMsg}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* History Sidebar */}
            <div className="w-full md:w-80 bg-[#0d0d0d] border-t md:border-t-0 md:border-l border-[#262626] flex flex-col shrink-0 md:h-full z-10 order-3 md:order-3 max-h-[300px] md:max-h-none">
                <div className="h-14 border-b border-[#262626] flex items-center px-6 gap-2 bg-[#141414]">
                    <History size={16} className="text-gray-400" />
                    <span className="text-sm font-bold text-white">历史记录 ({history.length})</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {history.map(vid => (
                        <div key={vid.id} onClick={() => selectHistoryItem(vid)} className={`group bg-[#1a1a1a] rounded-xl overflow-hidden cursor-pointer border hover:border-rose-500/50 transition-all relative ${currentVideo?.id === vid.id ? 'border-rose-500 ring-1 ring-rose-500' : 'border-[#333]'}`}>
                            <div className="aspect-video relative bg-black">
                                <video src={vid.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" muted />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                                    <Play size={24} className="text-white drop-shadow-lg" fill="currentColor" />
                                </div>
                            </div>
                            <div className="p-3">
                                <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed mb-2">{vid.params.prompt}</p>
                                <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                                    <span>{new Date(vid.timestamp).toLocaleTimeString()}</span>
                                    <div className="flex gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); restoreParameters(vid); }} className="hover:text-rose-400 transition-colors"><RotateCcw size={12} /></button>
                                        <button className="hover:text-white transition-colors"><Download size={12} /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};

export default VideoGenView;
