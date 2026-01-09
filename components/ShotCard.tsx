
import React, { useRef, useState, useEffect } from 'react';
import { Shot } from '../types';
import { Camera, Video, Mic, Image as ImageIcon, Clock, RefreshCw, Copy, Film, Music, Upload, Trash2, ArrowRight, AlertTriangle, CheckCheck, Edit2, ChevronDown, Volume2, Globe, Download, Maximize, ArrowDown, Grid3x3 } from 'lucide-react';
import FancyLoader from './FancyLoader';

interface ShotCardProps {
  shot: Shot;
  onRegenerateImage: (shotId: number, prompt: string) => void;
  onGenerateVideo: (shotId: number) => void;
  onImageClick: (imageUrl: string) => void;
  onUpdateShot: (shotId: number, updates: Partial<Shot>) => void;
  onUseAsNextRef?: () => void;
}

const CAMERA_MOVEMENTS = [
    "Push In (推镜头)",
    "Pull Out (拉镜头)",
    "Pan Left (左摇)",
    "Pan Right (右摇)",
    "Tilt Up (上摇)",
    "Tilt Down (下摇)",
    "Zoom In (变焦推进)",
    "Zoom Out (变焦拉远)",
    "Tracking (跟拍)",
    "Handheld (手持)",
    "Static (固定)",
    "Arc (环绕)",
    "Crane Up (升降上升)",
    "Crane Down (升降下降)",
    "Drone (无人机)"
];

const ShotCard: React.FC<ShotCardProps> = ({ shot, onRegenerateImage, onGenerateVideo, onImageClick, onUpdateShot, onUseAsNextRef }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null); 
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isEditingMovement, setIsEditingMovement] = useState(false);
  const movementInputRef = useRef<HTMLInputElement>(null);
  const [langMode, setLangMode] = useState<'dual' | 'zh' | 'en'>('dual');

  // Defensive Check: If shot is null/undefined for any reason
  if (!shot) return null;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isEditingMovement && movementInputRef.current && !movementInputRef.current.parentElement?.contains(event.target as Node)) {
        setIsEditingMovement(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditingMovement]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleCopyText = (e: React.MouseEvent, text: string, fieldId: string) => {
      e.stopPropagation();
      navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopySpec = (e: React.MouseEvent, text: string, fieldId: string) => {
      e.stopPropagation();
      navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 1500);
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (shot.imageUrl) {
        onImageClick(shot.imageUrl);
    }
  };

  const handleRegenerateClick = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    // Prefer English prompt if available for better generation, otherwise Chinese
    onRegenerateImage(shot.id, shot.t2iPromptEn || shot.t2iPrompt);
  };

  const handleWideShot = (e: React.MouseEvent) => {
      e.stopPropagation();
      const basePrompt = shot.t2iPromptEn || shot.t2iPrompt;
      const widePrompt = `(Wide Shot:1.5), (Panoramic View), (Establishing Shot), ${basePrompt}`;
      onRegenerateImage(shot.id, widePrompt);
  };

  const handleNineGrid = (e: React.MouseEvent) => {
      e.stopPropagation();
      const basePrompt = shot.t2iPromptEn || shot.t2iPrompt;
      // Prompt engineering for 9-grid layout
      const nineGridPrompt = `(9-panel storyboard grid:1.5), (3x3 layout), sequential storytelling, cinematic storyboard sketch, distinct panels, highly detailed, ${basePrompt}`;
      onRegenerateImage(shot.id, nineGridPrompt);
  };

  const handleRefNext = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onUseAsNextRef) onUseAsNextRef();
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onGenerateVideo(shot.id);
  };

  const handleLastFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateShot(shot.id, { lastFrameImageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateShot(shot.id, { audioFileUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLastFrame = (e: React.MouseEvent) => {
      e.stopPropagation();
      onUpdateShot(shot.id, { lastFrameImageUrl: undefined });
  };

  const handleRemoveAudio = (e: React.MouseEvent) => {
      e.stopPropagation();
      onUpdateShot(shot.id, { audioFileUrl: undefined });
  };

  const handleUpdateMovement = (newVal: string) => {
      onUpdateShot(shot.id, { cameraMovement: newVal });
      setIsEditingMovement(false);
  };

  // Quick Export Function
  const handleQuickExport = async (e: React.MouseEvent) => {
      e.stopPropagation();
      const url = shot.videoUrl || shot.imageUrl;
      if (!url) return;

      const isVideo = !!shot.videoUrl;
      const ext = isVideo ? 'mp4' : 'png';
      // Safety check for shotNumber
      const numStr = (shot.shotNumber || 0).toString().padStart(3, '0');
      const filename = `shot-${numStr}-${shot.id}.${ext}`;

      try {
          if (url.startsWith('data:')) {
              // Base64
              const link = document.createElement('a');
              link.href = url;
              link.download = filename;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
          } else {
              // Remote URL (Fetch blob to bypass some CORS download issues)
              const response = await fetch(url);
              const blob = await response.blob();
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = filename;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(link.href);
          }
      } catch (err) {
          console.error("Download failed, trying direct open", err);
          window.open(url, '_blank');
      }
  };

  const toggleLangMode = () => {
      setLangMode(prev => prev === 'dual' ? 'zh' : prev === 'zh' ? 'en' : 'dual');
  };

  const getLangLabel = () => {
      switch(langMode) {
          case 'dual': return '双语';
          case 'zh': return '中文';
          case 'en': return 'EN';
      }
  };

  // Helper to parse "English (Chinese)" format roughly if needed, otherwise just display
  const formatBilingual = (text?: string) => {
      if (!text) return { en: '-', zh: '' };
      
      // Assuming text is like "Close-up (特写)"
      const match = text.match(/^(.+?)\s*\((.+?)\)$/);
      if (match) {
          return { en: match[1], zh: match[2] };
      }
      return { en: text, zh: '' };
  };

  const shotSize = formatBilingual(shot.shotSize);
  const movement = formatBilingual(shot.cameraMovement);

  return (
    // Responsive Layout: Flex Col on mobile, Row on tablet/desktop
    <div className={`bg-[#1a1a1a] border rounded-xl flex flex-col md:flex-row shadow-lg mb-8 transition-colors duration-300 group ${shot.error && !shot.videoUrl ? 'border-red-900/50' : 'border-[#333] hover:border-cinema-accent/50'}`}>
      
      {/* Visual Section: Full width on mobile, Fixed width on desktop */}
      <div 
        className={`w-full md:w-96 relative aspect-video bg-black flex-shrink-0 border-b md:border-b-0 md:border-r border-[#333] rounded-t-xl md:rounded-l-xl md:rounded-r-none overflow-hidden ${shot.imageUrl ? 'cursor-zoom-in' : ''}`}
        onClick={handleImageClick}
      >
        {shot.videoUrl ? (
           // 1. Video Player (Highest Priority if successful)
           <video 
             src={shot.videoUrl} 
             controls 
             className="w-full h-full object-cover" 
             onClick={(e) => e.stopPropagation()} 
           />
        ) : shot.isGeneratingVideo ? (
           // 2. Video Loading State
           <div className="w-full h-full flex flex-col items-center justify-center bg-[#0f0f0f] relative overflow-hidden">
             {/* Progress Background */}
             <div className="absolute inset-0 bg-purple-900/10 z-0"></div>
             
             <div className="z-10 flex flex-col items-center w-3/4">
                 <FancyLoader type="video" size="sm" />
                 <div className="flex justify-between w-full text-[10px] uppercase font-mono text-purple-300 mt-2 mb-1 px-1">
                    <span>Generating Video...</span>
                    <span>{shot.generationProgress || 0}%</span>
                 </div>
                 {/* Visual Progress Bar */}
                 <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)] transition-all duration-300 ease-out"
                        style={{ width: `${shot.generationProgress || 0}%` }}
                    />
                 </div>
                 <span className="text-[9px] text-gray-500 mt-2 animate-pulse">{shot.generationStatus || 'Processing'}</span>
             </div>
           </div>
        ) : shot.isGeneratingImage ? (
          // 3. Image Loading State
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#0f0f0f]">
             <FancyLoader type="image" size="sm" text="RENDERING..." />
          </div>
        ) : shot.error ? (
          // 4. Error State (Handles both Image and Video failures)
          <div className="relative w-full h-full group error-container">
                {/* Background: If we have an image (Video Gen Failed), show it dimmed. If no image (Image Gen Failed), show red bg */}
                {shot.imageUrl ? (
                    <img src={shot.imageUrl} className="w-full h-full object-cover opacity-40 blur-[2px] transition-opacity" alt="Background" />
                ) : (
                    <div className="absolute inset-0 bg-red-950/30 pattern-grid-lg" />
                )}

                {/* Error Content Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 backdrop-blur-sm bg-black/40">
                    <div className="bg-red-500/20 p-3 rounded-full mb-3 text-red-500 ring-1 ring-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse">
                        <AlertTriangle size={24} />
                    </div>
                    
                    <span className="text-red-400 font-bold text-sm tracking-wider uppercase mb-1">
                        {shot.imageUrl ? "VIDEO GENERATION FAILED" : "IMAGE GENERATION FAILED"}
                    </span>
                    
                    <div className="bg-black/50 rounded px-2 py-1 mb-4 max-w-full">
                        <p className="text-red-200/90 text-[10px] line-clamp-2 font-mono">
                            {shot.error}
                        </p>
                    </div>
                    
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            // If we have an image, retry video. If not, retry image.
                            if (shot.imageUrl) {
                                handleVideoClick(e);
                            } else {
                                handleRegenerateClick(e);
                            }
                        }}
                        className="bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white px-5 py-2 rounded-full text-xs font-bold shadow-lg shadow-red-900/50 flex items-center gap-2 transition-all transform hover:scale-105 border border-red-500/30"
                    >
                        <RefreshCw size={14} /> 
                        {shot.imageUrl ? "Retry Video" : "Retry Image"}
                    </button>
                </div>
          </div>
        ) : shot.imageUrl ? (
          // 5. Success Image State (Static)
          <img 
            src={shot.imageUrl} 
            alt={`Shot ${shot.shotNumber}`} 
            className="w-full h-full object-cover"
          />
        ) : (
          // 6. Empty State
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-700 bg-[#0f0f0f]">
             <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
             <span className="text-xs font-mono">NO SIGNAL</span>
          </div>
        )}
        
        <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-white border border-white/10 shadow-sm font-mono z-10 pointer-events-none">
          SHOT {(shot.shotNumber || 0).toString().padStart(2, '0')}
        </div>
        
        {/* Quick Export Button (Top Right) */}
        {(shot.imageUrl || shot.videoUrl) && !shot.isGeneratingVideo && !shot.error && (
            <button 
                onClick={handleQuickExport}
                className="absolute top-3 right-3 bg-black/60 hover:bg-white hover:text-black text-white p-1.5 rounded backdrop-blur-md transition-colors z-20 shadow-lg border border-white/10"
                title={shot.videoUrl ? "导出视频" : "导出图片"}
            >
                <Download size={14} />
            </button>
        )}
        
        {/* Last Frame Preview (Mini) */}
        {shot.lastFrameImageUrl && !shot.videoUrl && !shot.error && (
            <div 
                className="absolute bottom-3 right-3 w-16 h-9 rounded border border-white/30 overflow-hidden shadow-lg z-20 group/lastframe bg-black cursor-pointer hover:scale-110 transition-transform"
                onClick={(e) => { e.stopPropagation(); onImageClick(shot.lastFrameImageUrl!); }}
                title="Last Frame (尾帧)"
            >
                <img src={shot.lastFrameImageUrl} alt="Last" className="w-full h-full object-cover opacity-80" />
                <button 
                    onClick={handleRemoveLastFrame}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/lastframe:opacity-100 transition-opacity"
                >
                    <Trash2 size={10} className="text-red-400" />
                </button>
            </div>
        )}

        {/* Hover Actions */}
        {!shot.isGeneratingImage && !shot.isGeneratingVideo && !shot.error && (
            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 pointer-events-none rounded-t-xl md:rounded-l-xl md:rounded-r-none backdrop-blur-sm">
                <div className="pointer-events-auto flex flex-col gap-2 w-full px-6">
                    {/* Row 1: Regenerate Full Width */}
                    <button 
                        onClick={handleRegenerateClick}
                        className="w-full bg-[#262626] border border-[#444] text-white px-2 py-2 rounded-lg font-bold text-[10px] hover:bg-[#333] flex items-center justify-center gap-1.5 transform hover:scale-105 transition-all shadow-lg"
                    >
                        <RefreshCw size={12} /> Regenerate
                    </button>

                    {/* Row 2: Variations */}
                    <div className="grid grid-cols-2 gap-2">
                        <button 
                            onClick={handleWideShot}
                            className="bg-[#262626] border border-[#444] text-white px-2 py-2 rounded-lg font-bold text-[10px] hover:bg-[#333] flex items-center justify-center gap-1.5 transform hover:scale-105 transition-all shadow-lg"
                        >
                            <Maximize size={12} /> Wide Shot
                        </button>
                        <button 
                            onClick={handleNineGrid}
                            className="bg-[#262626] border border-[#444] text-white px-2 py-2 rounded-lg font-bold text-[10px] hover:bg-[#333] flex items-center justify-center gap-1.5 transform hover:scale-105 transition-all shadow-lg"
                        >
                            <Grid3x3 size={12} /> 9-Grid
                        </button>
                    </div>
                    
                    {/* Row 3: Video / Flow */}
                    {shot.imageUrl && (
                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={handleVideoClick}
                                className="bg-purple-600 text-white px-2 py-2 rounded-lg font-bold text-[10px] hover:bg-purple-500 flex items-center justify-center gap-1.5 transform hover:scale-105 transition-all shadow-lg border border-purple-400/50"
                            >
                                <Film size={12} /> Video
                            </button>
                            {onUseAsNextRef && (
                                <button 
                                    onClick={handleRefNext}
                                    className="bg-blue-600 text-white px-2 py-2 rounded-lg font-bold text-[10px] hover:bg-blue-500 flex items-center justify-center gap-1.5 transform hover:scale-105 transition-all shadow-lg border border-blue-400/50"
                                    title="Use current image as reference for next shot"
                                >
                                    <ArrowDown size={12} /> Ref Next
                                </button>
                            )}
                        </div>
                    )}
                    
                    {/* Upload Last Frame Action */}
                    <div className="flex justify-center mt-2 pt-2 border-t border-white/10">
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleLastFrameUpload} 
                        />
                        <button 
                             onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                             className="bg-black/50 backdrop-blur-md border border-white/20 text-gray-400 px-3 py-1.5 rounded-full text-[10px] hover:bg-black/70 flex items-center gap-2 hover:text-white transition-colors w-full justify-center"
                        >
                            <Upload size={10} /> 
                            {shot.lastFrameImageUrl ? "更换尾帧 (Change Last)" : "上传尾帧 (Upload Last)"}
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Info Section */}
      <div className="flex-1 flex flex-col min-w-0 md:rounded-r-xl rounded-b-xl overflow-visible">
        
        {/* Shot Specs Header */}
        <div className="p-4 border-b border-[#262626] bg-[#1a1a1a] flex flex-wrap gap-4 justify-between md:justify-start md:rounded-tr-xl relative z-30 items-start">
           
           {/* Language Toggle */}
           <button 
               onClick={toggleLangMode}
               className="absolute top-2 right-2 z-40 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/40 border border-[#333] text-[10px] text-gray-400 hover:text-white hover:border-gray-500 transition-all backdrop-blur-sm"
               title="切换语言显示模式 / Toggle Language Display"
           >
               <Globe size={10} />
               <span>{getLangLabel()}</span>
           </button>

           <SpecItem 
                icon={<Camera size={16} />} 
                labelZh="景别" 
                labelEn="Shot Size" 
                valueZh={shotSize.zh} 
                valueEn={shotSize.en}
                colorClass="text-blue-400" 
                onCopy={(e: any) => handleCopySpec(e, `${shotSize.en} ${shotSize.zh}`, `size-${shot.id}`)}
                isCopied={copiedField === `size-${shot.id}`}
           />
           
           {/* Editable Movement Spec */}
           <div className="relative group/movement">
              <div 
                onClick={() => setIsEditingMovement(!isEditingMovement)} 
                className="cursor-pointer hover:bg-[#252525] rounded-md transition-colors relative pr-5"
                title="Click to change movement"
              >
                  <SpecItem 
                        icon={<Video size={16} />} 
                        labelZh="运镜" 
                        labelEn="Movement" 
                        valueZh={movement.zh} 
                        valueEn={movement.en}
                        colorClass="text-purple-400" 
                        onCopy={(e: any) => handleCopySpec(e, `${movement.en} ${movement.zh}`, `move-${shot.id}`)}
                        isCopied={copiedField === `move-${shot.id}`}
                   />
                   <div className="absolute top-1/2 -translate-y-1/2 right-1 text-gray-600 group-hover/movement:text-gray-300 transition-colors">
                        <ChevronDown size={12} />
                   </div>
              </div>

              {/* Dropdown Popover */}
              {isEditingMovement && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-2xl p-2 flex flex-col gap-2 animate-fade-in ring-1 ring-purple-900/50 z-50">
                      <input 
                          ref={movementInputRef}
                          defaultValue={shot.cameraMovement}
                          autoFocus
                          className="w-full bg-black border border-[#333] rounded px-3 py-2 text-xs text-white focus:border-purple-500 outline-none placeholder-gray-600"
                          placeholder="Type custom movement..."
                          onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                  handleUpdateMovement(e.currentTarget.value);
                              }
                          }}
                      />
                      <div className="h-px bg-[#262626]"></div>
                      <div className="max-h-48 overflow-y-auto space-y-0.5 custom-scrollbar pr-1">
                          {CAMERA_MOVEMENTS.map(m => (
                              <button 
                                  key={m}
                                  onClick={() => handleUpdateMovement(m)}
                                  className={`w-full text-left px-2 py-1.5 hover:bg-[#262626] rounded text-xs transition-colors flex items-center justify-between group/item ${shot.cameraMovement === m ? 'text-purple-400 font-bold bg-[#262626]' : 'text-gray-400'}`}
                              >
                                  <span>{m}</span>
                                  {shot.cameraMovement === m && <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>}
                              </button>
                          ))}
                      </div>
                  </div>
              )}
           </div>

           <SpecItem 
                icon={<Clock size={16} />} 
                labelZh="时长" 
                labelEn="Duration" 
                valueZh="" 
                valueEn={shot.duration}
                colorClass="text-green-400" 
           />
           
           {/* Audio Spec with Upload */}
           <div className="relative group/audio md:w-auto w-full">
               <SpecItem 
                    icon={<Music size={16} />} 
                    labelZh="音效" 
                    labelEn="Sound/BGM" 
                    valueZh={shot.audioPromptZh} 
                    valueEn={shot.audioPromptEn}
                    colorClass={shot.audioFileUrl ? "text-pink-400 font-bold" : "text-gray-400"}
                    fullWidth={true}
                    onCopy={(e: any) => handleCopySpec(e, `${shot.audioPromptEn || ''} ${shot.audioPromptZh || ''}`, `audio-${shot.id}`)}
               />
               <input 
                    type="file" 
                    ref={audioInputRef} 
                    className="hidden" 
                    accept="audio/*" 
                    onChange={handleAudioUpload} 
               />
               
               {/* Audio Action Button */}
               <button 
                    onClick={(e) => { e.stopPropagation(); if(shot.audioFileUrl) return; audioInputRef.current?.click(); }}
                    className={`absolute right-6 top-1.5 p-1 rounded transition-colors flex items-center gap-1 text-[10px] border ${
                        shot.audioFileUrl 
                        ? 'bg-pink-900/30 text-pink-400 border-pink-500/50 cursor-default' 
                        : 'bg-[#222] text-gray-500 border-[#444] hover:text-white hover:border-gray-300'
                    }`}
                    title={shot.audioFileUrl ? "Audio File Attached" : "Upload Audio File"}
               >
                    {shot.audioFileUrl ? (
                        <>
                            <Volume2 size={10} /> 
                            <span>File</span>
                            <span 
                                onClick={handleRemoveAudio} 
                                className="ml-1 hover:text-red-400 cursor-pointer p-0.5 rounded-full hover:bg-red-900/20"
                            >
                                <Trash2 size={8} />
                            </span>
                        </>
                    ) : (
                        <>
                            <Upload size={10} /> 
                            <span className="hidden sm:inline">Upload</span>
                        </>
                    )}
               </button>
           </div>
        </div>

        <div className="p-5 space-y-5">
             {/* Content / Script with Click-to-Copy */}
             <div>
                {(langMode === 'dual' || langMode === 'zh') && (
                    <div 
                        className="relative group/zh cursor-pointer rounded -ml-2 pl-2 p-1 transition-colors hover:bg-[#222]"
                        onClick={(e) => handleCopyText(e, shot.contentZh, `zh-${shot.id}`)}
                        title="Click to copy"
                    >
                        <h3 className="text-lg font-bold text-gray-100 leading-snug mb-1">
                        {shot.contentZh}
                        </h3>
                        {copiedField === `zh-${shot.id}` && (
                            <span className="absolute right-2 top-2 bg-green-900/80 text-green-300 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 animate-fade-in shadow-lg">
                                <CheckCheck size={10} /> Copied!
                            </span>
                        )}
                    </div>
                )}

                {(langMode === 'dual' || langMode === 'en') && (
                    <div 
                        className="relative group/en cursor-pointer rounded -ml-2 pl-2 p-1 transition-colors hover:bg-[#222]"
                        onClick={(e) => handleCopyText(e, shot.contentEn, `en-${shot.id}`)}
                        title="Click to copy"
                    >
                        <p className={`text-sm text-gray-500 font-light italic font-serif ${langMode === 'en' ? 'text-gray-300 not-italic font-sans text-base' : ''}`}>
                        {shot.contentEn}
                        </p>
                        {copiedField === `en-${shot.id}` && (
                            <span className="absolute right-2 top-2 bg-green-900/80 text-green-300 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 animate-fade-in shadow-lg">
                                <CheckCheck size={10} /> Copied!
                            </span>
                        )}
                    </div>
                )}
             </div>
             
             {/* Visual Description */}
             <div className="pl-3 border-l-2 border-[#333]">
                {(langMode === 'dual' || langMode === 'zh') && (
                    <p className="text-sm text-gray-300 mb-1">{shot.visualDescriptionZh}</p>
                )}
                {(langMode === 'dual' || langMode === 'en') && (
                    <p className={`text-xs text-gray-600 ${langMode === 'en' ? 'text-gray-400 text-sm' : ''}`}>{shot.visualDescriptionEn}</p>
                )}
             </div>

             {/* Narration - BILINGUAL CONTRAST */}
             <div className="bg-[#111] p-3 rounded-lg border border-[#262626] relative">
                 <div className="absolute left-0 top-3 w-1 h-8 bg-cinema-accent rounded-r"></div>
                 <div className="flex items-center gap-2 text-cinema-accent/80 text-[10px] font-bold uppercase tracking-wider mb-2">
                    <Mic className="w-3 h-3" /> 对白 / NARRATION
                 </div>
                 <div className="grid grid-cols-1 gap-2">
                     {(langMode === 'dual' || langMode === 'zh') && (
                        <p className={`text-gray-200 text-sm font-medium ${langMode === 'dual' ? 'border-b border-[#222] pb-2' : ''}`}>
                            {shot.narrationZh || "..."}
                        </p>
                     )}
                     {(langMode === 'dual' || langMode === 'en') && (
                        <p className={`text-gray-500 text-xs italic ${langMode === 'en' ? 'text-gray-300 not-italic text-sm' : ''}`}>
                            {shot.narrationEn || "..."}
                        </p>
                     )}
                 </div>
             </div>
        </div>

        {/* Technical Prompts Grid - BILINGUAL CONTRAST MODE */}
        <div className="bg-[#111] p-4 text-xs space-y-3 border-t border-[#262626] md:rounded-br-xl">
            
            {/* T2I */}
            <BilingualPromptBlock 
                titleZh="文生图" 
                titleEn="T2I Prompt" 
                color="text-cinema-accent"
                textZh={shot.t2iPrompt}
                textEn={shot.t2iPromptEn}
                onCopy={() => copyToClipboard(`${shot.t2iPrompt}\n${shot.t2iPromptEn}`)}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 {/* I2V */}
                 <BilingualPromptBlock 
                    titleZh="图生视" 
                    titleEn="I2V Prompt" 
                    color="text-purple-400"
                    textZh={shot.i2vPrompt}
                    textEn={shot.i2vPromptEn}
                    onCopy={() => copyToClipboard(`${shot.i2vPrompt}\n${shot.i2vPromptEn}`)}
                />
                {/* T2V */}
                 <BilingualPromptBlock 
                    titleZh="文生视" 
                    titleEn="T2V Prompt" 
                    color="text-blue-400"
                    textZh={shot.t2vPrompt}
                    textEn={shot.t2vPromptEn}
                    onCopy={() => copyToClipboard(`${shot.t2vPrompt}\n${shot.t2vPromptEn}`)}
                />
            </div>
        </div>
      </div>
    </div>
  );
};

// --- Helper Components ---

const SpecItem = ({ icon, labelZh, labelEn, valueZh, valueEn, colorClass, fullWidth, onCopy, isCopied }: any) => (
    <div className={`flex items-start gap-3 min-w-[100px] ${fullWidth ? 'w-full md:w-auto' : ''} group/spec relative`}>
        <div className={`mt-0.5 p-1.5 bg-[#252525] rounded-md ${colorClass}`}>
            {icon}
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex flex-col mb-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase leading-none">{labelEn}</span>
                <span className="text-xs text-gray-600 leading-none mt-0.5">{labelZh}</span>
            </div>
            <div className={`text-xs font-bold text-gray-200 truncate pr-6`}>
                {valueEn || "-"}
                {valueZh && <span className="block text-[10px] font-normal text-gray-500 truncate">{valueZh}</span>}
            </div>
        </div>
        {onCopy && (
             <button 
                onClick={onCopy}
                className={`absolute right-0 top-2 transition-all ${isCopied ? 'text-green-500 opacity-100' : 'text-gray-500 opacity-0 group-hover/spec:opacity-100 hover:text-white'}`}
                title="Copy"
             >
                {isCopied ? <CheckCheck size={12} /> : <Copy size={12} />}
             </button>
        )}
    </div>
);

const BilingualPromptBlock = ({ titleZh, titleEn, color, textZh, textEn, onCopy }: any) => (
    <div className="group/prompt relative">
        <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <div className="flex items-baseline gap-2">
                <span className={`font-mono font-bold text-[10px] uppercase ${color}`}>{titleEn}</span>
                <span className="text-[10px] text-gray-600 border-l border-[#333] pl-2">{titleZh}</span>
            </div>
            <button onClick={onCopy} className="hover:text-white transition-colors opacity-50 group-hover/prompt:opacity-100"><Copy size={10} /></button>
        </div>
        <div className="bg-black/40 rounded border border-[#333] overflow-hidden flex flex-col md:flex-row">
            <div className="p-2 border-b md:border-b-0 md:border-r border-[#333/50] text-gray-400 font-mono w-full md:w-1/2">
                <span className="text-[8px] text-gray-600 select-none block mb-0.5">CN</span>
                {textZh || "-"}
            </div>
            <div className="p-2 text-gray-500 font-mono italic bg-black/20 w-full md:w-1/2">
                 <span className="text-[8px] text-gray-700 select-none block mb-0.5">EN</span>
                {textEn || "-"}
            </div>
        </div>
    </div>
);

export default ShotCard;
