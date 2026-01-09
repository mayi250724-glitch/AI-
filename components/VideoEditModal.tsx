
import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Video, Sparkles, MessageSquare, ArrowRight, Loader2, Play, Pause, ChevronDown, Check } from 'lucide-react';
import * as GeminiService from '../services/geminiService';
import FancyLoader from './FancyLoader';

interface VideoEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceVideoUrl: string;
  onSuccess: (newVideoUrl: string) => void;
}

interface ChatMessage {
    id: string;
    role: 'user' | 'ai';
    content: string;
    videoUrl?: string; // If AI returns a new video
}

const VIDEO_EDIT_MODELS = [
    { id: 'kling-video-o1', name: '可灵 Kling O1 (推荐)' },
    { id: 'jimeng-4.5', name: '万象 Jimeng 4.5' },
    { id: 'minimax-video-01', name: 'MiniMax Video' },
    { id: 'veo-3.1-pro', name: 'Veo Pro (Google)' }
];

const VideoEditModal: React.FC<VideoEditModalProps> = ({ isOpen, onClose, sourceVideoUrl, onSuccess }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(sourceVideoUrl);
  const [selectedModel, setSelectedModel] = useState(VIDEO_EDIT_MODELS[0].id);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Initialize chat
  useEffect(() => {
      if (isOpen) {
          setMessages([
              { 
                  id: 'init', 
                  role: 'ai', 
                  content: '你好！我是你的 AI 视频剪辑助理。请告诉我你想如何修改这段视频？(例如：把背景改成下雪天、把人物换成钢铁侠、配一段激昂的音乐...)' 
              }
          ]);
          setCurrentVideo(sourceVideoUrl);
          setIsPlaying(true);
      }
  }, [isOpen, sourceVideoUrl]);

  // Auto scroll chat
  useEffect(() => {
      if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
  }, [messages]);

  const handleSendMessage = async () => {
      if (!inputText.trim()) return;
      
      const userMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'user',
          content: inputText
      };
      
      setMessages(prev => [...prev, userMsg]);
      setInputText('');
      setIsProcessing(true);

      // Add temporary loading message
      const loadingId = 'loading-' + Date.now();
      setMessages(prev => [...prev, { id: loadingId, role: 'ai', content: '正在处理您的视频请求，请稍候...' }]);

      try {
          // Use the last valid video as source for progressive editing
          const resultUrl = await GeminiService.editVideo(currentVideo, userMsg.content, selectedModel);
          
          // Remove loading message and add result
          setMessages(prev => prev.filter(m => m.id !== loadingId).concat({
              id: Date.now().toString() + '-ai',
              role: 'ai',
              content: '视频修改完成！点击右侧预览。',
              videoUrl: resultUrl
          }));
          
          setCurrentVideo(resultUrl);
          onSuccess(resultUrl); // Notify parent to update
          
      } catch (e: any) {
          setMessages(prev => prev.filter(m => m.id !== loadingId).concat({
              id: Date.now().toString() + '-err',
              role: 'ai',
              content: `抱歉，视频生成失败: ${e.message || "未知错误"}`
          }));
      } finally {
          setIsProcessing(false);
      }
  };

  const togglePlay = () => {
      if (videoRef.current) {
          if (isPlaying) videoRef.current.pause();
          else videoRef.current.play();
          setIsPlaying(!isPlaying);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in bg-black/90 backdrop-blur-md">
        
        <div className="bg-[#121212] w-full max-w-6xl h-[85vh] border border-[#262626] rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative">
            
            <button onClick={onClose} className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-white/20 text-white rounded-full transition-colors">
                <X size={20} />
            </button>

            {/* Left: Video Preview */}
            <div className="w-full md:w-2/3 bg-black flex flex-col relative border-r border-[#262626]">
                <div className="flex-1 flex items-center justify-center bg-[url('https://grainy-gradients.vercel.app/noise.svg')] p-8">
                    <div className="relative shadow-2xl rounded-xl overflow-hidden border border-[#333] max-h-full max-w-full aspect-video group">
                        <video 
                            ref={videoRef}
                            src={currentVideo} 
                            className="w-full h-full object-contain bg-black"
                            loop
                            autoPlay
                            onClick={togglePlay}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                        />
                        <div className={`absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none transition-opacity duration-300 ${isPlaying ? 'opacity-0' : 'opacity-100'}`}>
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/50">
                                <Play size={32} className="text-white fill-white ml-1" />
                            </div>
                        </div>
                        
                        {/* Compare/Original Button Overlay */}
                        <div className="absolute top-4 left-4">
                             <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-bold text-white border border-white/10 flex items-center gap-2">
                                 <Video size={12} className="text-purple-400" />
                                 {currentVideo === sourceVideoUrl ? 'Original' : 'Edited Version'}
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Chat Interface */}
            <div className="w-full md:w-1/3 bg-[#111] flex flex-col">
                
                {/* Header */}
                <div className="h-16 border-b border-[#262626] flex items-center justify-between px-6 bg-[#161616]">
                    <div className="flex items-center gap-2">
                        <Sparkles className="text-purple-500" size={18} />
                        <h3 className="font-bold text-white">AI 视频对话编辑</h3>
                    </div>
                </div>

                {/* Model Selector */}
                <div className="p-4 border-b border-[#262626] bg-[#141414]">
                    <label className="text-xs text-gray-500 font-bold mb-2 block uppercase">编辑模型 (Edit Model)</label>
                    <div className="relative">
                        <select 
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg pl-3 pr-8 py-2 text-xs text-white focus:outline-none focus:border-purple-500 appearance-none font-bold cursor-pointer hover:bg-[#222] transition-colors"
                        >
                            {VIDEO_EDIT_MODELS.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#0f0f0f]" ref={chatContainerRef}>
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                msg.role === 'user' 
                                ? 'bg-purple-600 text-white rounded-tr-none' 
                                : 'bg-[#222] text-gray-200 border border-[#333] rounded-tl-none'
                            }`}>
                                {msg.content}
                                {msg.videoUrl && (
                                    <div 
                                        className="mt-2 rounded-lg overflow-hidden border border-white/10 cursor-pointer relative group"
                                        onClick={() => setCurrentVideo(msg.videoUrl!)}
                                    >
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-transparent transition-colors">
                                            <Play size={16} className="text-white" />
                                        </div>
                                        <video src={msg.videoUrl} className="w-full h-24 object-cover opacity-60" />
                                        <div className="absolute bottom-1 right-1 text-[9px] bg-black/60 px-1 rounded text-white">Click to Preview</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isProcessing && (
                        <div className="flex justify-start">
                            <div className="bg-[#222] border border-[#333] rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2 text-gray-400 text-xs">
                                <FancyLoader type="processing" size="sm" className="w-4 h-4" />
                                AI 正在重绘视频帧...
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-[#161616] border-t border-[#262626]">
                    <div className="relative">
                        <textarea
                            value={setInputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                            placeholder="输入修改指令 (例如: 换成夜晚, 增加下雨特效...)"
                            className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-purple-500 resize-none h-12 min-h-[48px] max-h-24 custom-scrollbar"
                        />
                        <button 
                            onClick={handleSendMessage}
                            disabled={!inputText.trim() || isProcessing}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-600 mt-2 text-center">
                        AI 视频编辑基于多模态模型，生成可能需要 1-3 分钟，请耐心等待。
                    </p>
                </div>

            </div>
        </div>
    </div>
  );
};

export default VideoEditModal;
