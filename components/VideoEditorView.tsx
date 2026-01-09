
import React, { useState, useEffect, useRef } from 'react';
import { EditorClip, EditorTrack, TrackType } from '../types';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, Video, Type, Music, Sparkles, 
  Settings2, Scissors, Copy, Trash2, ZoomIn, ZoomOut, ArrowLeft, Download, 
  Layers, Palette, Type as TypeIcon, Image as ImageIcon, Box, Monitor, MoveHorizontal, FileJson
} from 'lucide-react';
import FancyLoader from './FancyLoader';
import * as JianYingService from '../services/jianyingService';

interface VideoEditorViewProps {
  initialResources: { 
      id: string; 
      url: string; 
      type: TrackType; 
      name: string; 
      thumbnail?: string;
      isImage?: boolean;
      duration?: number;
  }[];
  onBack: () => void;
}

const VideoEditorView: React.FC<VideoEditorViewProps> = ({ initialResources, onBack }) => {
  // --- STATE ---
  const [tracks, setTracks] = useState<EditorTrack[]>([
    { id: 'track-video', type: TrackType.VIDEO, clips: [] },
    { id: 'track-audio', type: TrackType.AUDIO, clips: [] },
    { id: 'track-text', type: TrackType.TEXT, clips: [] }
  ]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(10); // pixels per second
  const [resources, setResources] = useState(initialResources);
  const [activeTab, setActiveTab] = useState<'media' | 'audio' | 'text' | 'effects'>('media');
  const [isExporting, setIsExporting] = useState(false);
  
  const playerRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Auto-import resources to timeline
  useEffect(() => {
    // If timeline is empty, auto populate with video resources
    const videoTrack = tracks.find(t => t.type === TrackType.VIDEO);
    if (videoTrack && videoTrack.clips.length === 0 && initialResources.length > 0) {
        let currentTimeOffset = 0;
        const newClips: EditorClip[] = [];
        
        initialResources.filter(r => r.type === TrackType.VIDEO).forEach((res) => {
             // Use passed duration or default to 5s
             const duration = res.duration || 5; 
             newClips.push({
                 id: `clip-${Date.now()}-${Math.random()}`,
                 resourceId: res.id,
                 startOffset: currentTimeOffset,
                 duration: duration,
                 srcStart: 0,
                 type: TrackType.VIDEO,
                 name: res.name
             });
             currentTimeOffset += duration;
        });

        setTracks(prev => prev.map(t => t.id === 'track-video' ? { ...t, clips: newClips } : t));
    }
  }, []);

  // Playback Loop
  useEffect(() => {
      let interval: any;
      if (isPlaying) {
          interval = setInterval(() => {
              setCurrentTime(prev => prev + 0.1);
          }, 100);
      }
      return () => clearInterval(interval);
  }, [isPlaying]);

  // Derived active clip for rendering
  const activeClip = tracks.find(t => t.type === TrackType.VIDEO)?.clips.find(c => currentTime >= c.startOffset && currentTime < c.startOffset + c.duration);
  const activeResource = activeClip ? resources.find(r => r.id === activeClip.resourceId) : null;

  // Sync Player with Timeline Cursor
  useEffect(() => {
     if (playerRef.current && activeResource && !activeResource.isImage) {
         // Optimization: Only change src if different to avoid flickering
         const srcUrl = activeResource.url;
         if (!playerRef.current.src.includes(srcUrl)) {
             playerRef.current.src = srcUrl;
         }
         // Sync video time
         // We must account for the clip's internal start time (srcStart) + relative timeline position
         const relativeTime = currentTime - (activeClip?.startOffset || 0) + (activeClip?.srcStart || 0);
         
         // Allow a small drift to prevent stuttering updates
         if (Math.abs(playerRef.current.currentTime - relativeTime) > 0.5) {
            playerRef.current.currentTime = relativeTime;
         }
         
         if (isPlaying) playerRef.current.play().catch(() => {});
         else playerRef.current.pause();
     }
     
     // Auto stop at end
     const totalDuration = Math.max(...tracks.flatMap(t => t.clips.map(c => c.startOffset + c.duration)), 0);
     if (currentTime > totalDuration && isPlaying) {
         setIsPlaying(false);
         setCurrentTime(0);
     }

  }, [currentTime, tracks, isPlaying, resources, activeResource, activeClip]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      const ms = Math.floor((seconds % 1) * 100);
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
  };

  const handleClipClick = (e: React.MouseEvent, clipId: string) => {
      e.stopPropagation();
      setSelectedClipId(clipId);
  };

  const updateSelectedClip = (updates: Partial<EditorClip>) => {
      if (!selectedClipId) return;
      setTracks(prev => prev.map(track => ({
          ...track,
          clips: track.clips.map(clip => clip.id === selectedClipId ? { ...clip, ...updates } : clip)
      })));
  };

  const handleAddEffect = () => {
      if (!selectedClipId) return;
      updateSelectedClip({ 
          effects: [{ type: 'glitch', name: 'Glitch' }] 
      });
      // Visual feedback
      alert("✨ 特效已添加 (Effect Added)");
  };

  const handleAddTransition = () => {
      if(!selectedClipId) return;
      updateSelectedClip({ 
          transition: { type: 'dissolve', duration: 0.5, name: 'Dissolve' }
      });
      alert("⧖ 转场已添加 (Transition Added)");
  };

  const handleExport = () => {
      setIsExporting(true);
      setTimeout(() => {
          setIsExporting(false);
          alert("Export Complete! Video saved to local device.");
      }, 3000);
  };

  const handleExportDraft = () => {
      const jsonStr = JianYingService.createDraft(tracks, resources);
      JianYingService.downloadDraft(jsonStr);
      alert("剪映草稿已导出！\n请将下载的 'draft_content.json' 放入剪映草稿文件夹中即可识别。");
  };

  // Find currently selected clip object
  const selectedClip = tracks.flatMap(t => t.clips).find(c => c.id === selectedClipId);

  // Mock Data for Sidebar
  const sidebarItems = {
      media: resources,
      audio: [
          { id: 'a1', name: 'Cinematic Build', type: 'audio' },
          { id: 'a2', name: 'Ambient Space', type: 'audio' },
          { id: 'a3', name: 'Action Hit', type: 'audio' },
      ],
      text: [
          { id: 't1', name: 'Default Text', type: 'text' },
          { id: 't2', name: 'Title Wipe', type: 'text' },
          { id: 't3', name: 'Subtitle Preset', type: 'text' },
      ],
      effects: [
          { id: 'e1', name: 'Film Grain', type: 'effect' },
          { id: 'e2', name: 'VHS Glitch', type: 'effect' },
          { id: 'e3', name: 'Lens Flare', type: 'effect' },
      ]
  };

  return (
    <div className="h-screen w-screen bg-[#0f0f0f] text-gray-200 flex flex-col overflow-hidden font-sans">
        
        {/* TOP HEADER */}
        <div className="h-12 border-b border-[#262626] flex items-center justify-between px-4 bg-[#141414] shrink-0 z-50">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="text-gray-400 hover:text-white">
                    <ArrowLeft size={18} />
                </button>
                <div className="flex items-center gap-2">
                     <Box size={16} className="text-cinema-accent" />
                     <span className="font-bold text-sm hidden md:inline">Yesir Pro Editor</span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                 <span className="text-[10px] md:text-xs text-gray-500 mr-2 md:mr-4">{formatTime(currentTime)}</span>
                 
                 <button 
                    onClick={handleExportDraft}
                    className="px-2 md:px-4 py-1.5 bg-[#222] border border-[#333] text-gray-300 text-[10px] md:text-xs font-bold rounded-full hover:bg-[#333] hover:text-white flex items-center gap-1 md:gap-2 transition-all"
                    title="Export as CapCut/JianYing Draft"
                 >
                    <FileJson size={14} /> <span className="hidden md:inline">导出剪映草稿</span>
                 </button>

                 <button 
                    onClick={handleExport}
                    className="px-4 md:px-6 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-[10px] md:text-xs font-bold rounded-full hover:brightness-110 flex items-center gap-2"
                 >
                    <Download size={14} /> <span className="hidden md:inline">导出视频</span>
                 </button>
            </div>
        </div>

        {/* MAIN WORKSPACE - ADAPTIVE LAYOUT */}
        <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
            
            {/* 1. LEFT SIDEBAR (Resources) - Bottom on Mobile */}
            <div className="w-full md:w-80 flex flex-col border-b md:border-b-0 md:border-r border-[#262626] bg-[#111] order-3 md:order-1 h-64 md:h-full shrink-0">
                 {/* Tabs */}
                 <div className="flex h-10 md:h-12 border-b border-[#262626]">
                     <button onClick={() => setActiveTab('media')} className={`flex-1 flex flex-col items-center justify-center gap-1 text-[10px] ${activeTab === 'media' ? 'text-cinema-accent bg-[#1a1a1a]' : 'text-gray-500 hover:text-white'}`}>
                         <ImageIcon size={16} /> 媒体
                     </button>
                     <button onClick={() => setActiveTab('audio')} className={`flex-1 flex flex-col items-center justify-center gap-1 text-[10px] ${activeTab === 'audio' ? 'text-cinema-accent bg-[#1a1a1a]' : 'text-gray-500 hover:text-white'}`}>
                         <Music size={16} /> 音频
                     </button>
                     <button onClick={() => setActiveTab('text')} className={`flex-1 flex flex-col items-center justify-center gap-1 text-[10px] ${activeTab === 'text' ? 'text-cinema-accent bg-[#1a1a1a]' : 'text-gray-500 hover:text-white'}`}>
                         <TypeIcon size={16} /> 文字
                     </button>
                     <button onClick={() => setActiveTab('effects')} className={`flex-1 flex flex-col items-center justify-center gap-1 text-[10px] ${activeTab === 'effects' ? 'text-cinema-accent bg-[#1a1a1a]' : 'text-gray-500 hover:text-white'}`}>
                         <Sparkles size={16} /> 特效
                     </button>
                 </div>
                 
                 {/* List */}
                 <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2 content-start custom-scrollbar">
                     {activeTab === 'media' && resources.map(res => (
                         <div key={res.id} className="aspect-video bg-[#000] border border-[#333] rounded overflow-hidden relative group cursor-pointer hover:border-cinema-accent">
                             <img src={res.thumbnail || res.url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100" />
                             <div className="absolute top-1 right-1 px-1 bg-black/60 rounded text-[8px] text-white">
                                {res.isImage ? 'IMG' : 'VID'}
                             </div>
                             <span className="absolute bottom-1 left-1 text-[8px] bg-black/60 px-1 rounded text-white truncate max-w-full">{res.name}</span>
                             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40">
                                 <div className="w-6 h-6 rounded-full bg-cinema-accent flex items-center justify-center text-black font-bold">+</div>
                             </div>
                         </div>
                     ))}

                     {activeTab === 'audio' && sidebarItems.audio.map(item => (
                         <div key={item.id} className="col-span-2 h-10 bg-[#1a1a1a] border border-[#333] rounded flex items-center px-3 cursor-pointer hover:bg-[#222]">
                             <Music size={14} className="text-gray-500 mr-3" />
                             <span className="text-xs">{item.name}</span>
                             <span className="ml-auto text-[10px] text-gray-600">03:00</span>
                         </div>
                     ))}

                     {activeTab === 'text' && sidebarItems.text.map(item => (
                         <div key={item.id} className="col-span-2 h-12 bg-[#1a1a1a] border border-[#333] rounded flex items-center justify-center cursor-pointer hover:bg-[#222]">
                             <span className="text-lg font-bold text-white font-serif">{item.name}</span>
                         </div>
                     ))}

                     {activeTab === 'effects' && sidebarItems.effects.map(item => (
                         <div key={item.id} className="aspect-square bg-[#1a1a1a] border border-[#333] rounded flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-[#222] hover:border-cinema-accent" onClick={handleAddEffect}>
                             <Sparkles size={24} className="text-purple-500" />
                             <span className="text-xs">{item.name}</span>
                         </div>
                     ))}
                 </div>
            </div>

            {/* 2. CENTER PREVIEW & TIMELINE */}
            <div className="flex-1 flex flex-col bg-[#050505] order-1 md:order-2 h-auto md:h-full">
                
                {/* Player */}
                <div className="flex-1 relative flex items-center justify-center p-4 min-h-[300px] md:min-h-0">
                     <div className="aspect-video w-full h-full max-h-[60vh] bg-black shadow-2xl relative border border-[#222] flex items-center justify-center overflow-hidden">
                         {activeResource?.isImage ? (
                             <img 
                                src={activeResource.url}
                                className="w-full h-full object-contain"
                                alt="Scene Preview"
                             />
                         ) : (
                             <video 
                                ref={playerRef}
                                className="w-full h-full object-contain"
                                playsInline
                                muted={false} // Allow sound
                             />
                         )}
                         
                         {/* Text Overlay Mock */}
                         <div className="absolute inset-0 pointer-events-none flex items-end justify-center pb-8">
                             {/* Only show if text track has clip at current time */}
                             {tracks.find(t => t.type === TrackType.TEXT)?.clips.some(c => currentTime >= c.startOffset && currentTime < c.startOffset + c.duration) && (
                                 <h2 className="text-2xl md:text-4xl font-bold text-white drop-shadow-lg stroke-black" style={{ textShadow: '2px 2px 0 #000' }}>
                                     这是一个字幕示例
                                 </h2>
                             )}
                         </div>
                     </div>
                </div>

                {/* Toolbar */}
                <div className="h-10 bg-[#141414] border-t border-[#262626] flex items-center justify-center gap-6">
                     <button onClick={() => setCurrentTime(0)} className="text-gray-400 hover:text-white"><SkipBack size={18} /></button>
                     <button onClick={togglePlay} className="text-white hover:text-cinema-accent">
                         {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                     </button>
                     <button className="text-gray-400 hover:text-white"><SkipForward size={18} /></button>
                </div>

                {/* TIMELINE (Moved here for mobile logic if needed, but keeping separate is fine for flex flow) */}
                <div className="h-48 md:h-64 bg-[#0a0a0a] border-t border-[#262626] flex flex-col shrink-0 relative">
                    
                    {/* Timeline Tools */}
                    <div className="h-8 bg-[#141414] border-b border-[#222] flex items-center justify-between px-2">
                        <div className="flex gap-2">
                            <button className="p-1 hover:bg-[#222] rounded text-gray-400"><Scissors size={14} /></button>
                            <button className="p-1 hover:bg-[#222] rounded text-gray-400"><Copy size={14} /></button>
                            <button className="p-1 hover:bg-[#222] rounded text-gray-400"><Trash2 size={14} /></button>
                        </div>
                        <div className="flex items-center gap-2 pr-2">
                            <button onClick={() => setZoomLevel(Math.max(5, zoomLevel - 5))} className="p-1 hover:bg-[#222] rounded text-gray-400"><ZoomOut size={14} /></button>
                            <input type="range" min="5" max="50" value={zoomLevel} onChange={e => setZoomLevel(parseInt(e.target.value))} className="w-16 md:w-24 accent-cinema-accent h-1" />
                            <button onClick={() => setZoomLevel(Math.min(100, zoomLevel + 5))} className="p-1 hover:bg-[#222] rounded text-gray-400"><ZoomIn size={14} /></button>
                        </div>
                    </div>

                    {/* Timeline Tracks */}
                    <div className="flex-1 overflow-x-auto overflow-y-hidden relative custom-scrollbar" ref={timelineRef}>
                        <div className="min-w-full h-full relative" style={{ width: '2000px' /* Dynamic in real app */ }}>
                            
                            {/* Time Ruler */}
                            <div className="h-6 bg-[#111] border-b border-[#222] sticky top-0 z-10 flex items-end">
                                {Array.from({ length: 50 }).map((_, i) => (
                                    <div key={i} className="absolute bottom-0 h-2 border-l border-gray-600 text-[8px] text-gray-500 pl-1" style={{ left: i * zoomLevel * 5 }}>
                                        {i * 5}s
                                    </div>
                                ))}
                            </div>

                            {/* Cursor */}
                            <div 
                                className="absolute top-0 bottom-0 w-px bg-white z-30 pointer-events-none"
                                style={{ left: currentTime * zoomLevel }}
                            >
                                <div className="absolute -top-0 -translate-x-1/2 text-cinema-accent">▼</div>
                            </div>

                            {/* Tracks Render */}
                            <div className="p-2 space-y-2">
                                {tracks.map(track => (
                                    <div key={track.id} className="h-12 md:h-16 bg-[#111] border border-[#222] rounded relative flex items-center group">
                                        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-24 bg-[#1a1a1a] border-r border-[#222] z-10 flex items-center justify-center text-[10px] md:text-xs font-bold text-gray-500 sticky left-0 uppercase">
                                            {track.type}
                                        </div>
                                        <div className="pl-16 md:pl-24 w-full h-full relative">
                                            {track.clips.map(clip => (
                                                <div
                                                    key={clip.id}
                                                    onClick={(e) => handleClipClick(e, clip.id)}
                                                    className={`absolute top-1 bottom-1 rounded border overflow-hidden cursor-pointer select-none transition-all ${
                                                        selectedClipId === clip.id 
                                                        ? 'border-cinema-accent ring-1 ring-cinema-accent z-20' 
                                                        : 'border-transparent hover:border-white/50'
                                                    } ${
                                                        track.type === TrackType.VIDEO ? 'bg-blue-900/40' :
                                                        track.type === TrackType.AUDIO ? 'bg-green-900/40' :
                                                        'bg-purple-900/40'
                                                    }`}
                                                    style={{
                                                        left: clip.startOffset * zoomLevel,
                                                        width: clip.duration * zoomLevel
                                                    }}
                                                >
                                                    <div className="px-2 py-1 text-[8px] md:text-[10px] text-white/80 font-mono truncate">
                                                        {clip.name}
                                                    </div>
                                                    
                                                    {/* Visual Indicator for Effects */}
                                                    {clip.effects && clip.effects.length > 0 && (
                                                        <div className="absolute top-0 right-0 p-0.5 bg-purple-500 text-white rounded-bl">
                                                            <Sparkles size={8} />
                                                        </div>
                                                    )}

                                                    {/* Visual Indicator for Transition */}
                                                    {(clip.name.includes('⧖') || clip.transition) && (
                                                        <div className="absolute top-0 left-0 w-4 h-full bg-gradient-to-r from-white/30 to-transparent"></div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* 3. RIGHT INSPECTOR - Hidden on mobile if not selected, or stacked? Actually hide it or put it in a modal on mobile is better, but simple stacking at bottom is easiest adaptive fix without logic change */}
            <div className={`w-full md:w-64 bg-[#111] border-l border-[#262626] flex flex-col order-4 md:order-3 ${selectedClipId ? 'h-64 md:h-full' : 'h-0 md:h-full overflow-hidden'}`}>
                 <div className="h-10 border-b border-[#262626] flex items-center px-4 font-bold text-xs uppercase tracking-wider text-gray-500">
                     Attributes
                 </div>
                 <div className="flex-1 p-4 space-y-6 overflow-y-auto custom-scrollbar">
                     {selectedClip ? (
                         <>
                            <div className="pb-4 border-b border-[#333]">
                                <h4 className="font-bold text-sm text-white mb-1 truncate">{selectedClip.name}</h4>
                                <span className="text-[10px] text-gray-500 uppercase">{selectedClip.type}</span>
                            </div>

                            {/* Trim Controls */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                                    <Scissors size={12} /> 剪辑 (Trim)
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[10px] text-gray-600 block mb-1">In Point</label>
                                        <input 
                                            type="number" 
                                            step="0.1"
                                            value={selectedClip.srcStart} 
                                            onChange={(e) => updateSelectedClip({ srcStart: parseFloat(e.target.value) })}
                                            className="w-full bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-xs text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-600 block mb-1">Duration</label>
                                        <input 
                                            type="number" 
                                            step="0.1"
                                            value={selectedClip.duration} 
                                            onChange={(e) => updateSelectedClip({ duration: parseFloat(e.target.value) })}
                                            className="w-full bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-xs text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-[#333] space-y-2">
                                <button 
                                    onClick={handleAddTransition}
                                    className="w-full py-1.5 bg-[#222] hover:bg-[#333] text-gray-300 text-xs rounded flex items-center justify-center gap-2 border border-[#333]"
                                >
                                    <MoveHorizontal size={12} /> 添加转场 (Transition)
                                </button>
                                <button 
                                    onClick={handleAddEffect}
                                    className="w-full py-1.5 bg-[#222] hover:bg-[#333] text-gray-300 text-xs rounded flex items-center justify-center gap-2 border border-[#333]"
                                >
                                    <Sparkles size={12} /> 添加特效 (Effect)
                                </button>
                            </div>

                            {selectedClip.transition && (
                                <div className="p-2 bg-blue-900/20 border border-blue-500/20 rounded text-[10px] text-blue-300 flex items-center gap-2">
                                    <MoveHorizontal size={10} /> {selectedClip.transition.name} ({selectedClip.transition.duration}s)
                                </div>
                            )}

                            {selectedClip.effects && selectedClip.effects.map((ef, idx) => (
                                <div key={idx} className="p-2 bg-purple-900/20 border border-purple-500/20 rounded text-[10px] text-purple-300 flex items-center gap-2">
                                    <Sparkles size={10} /> {ef.name}
                                </div>
                            ))}

                            <div className="space-y-2 pt-2 border-t border-[#333]">
                                <label className="text-xs font-bold text-gray-400">Scale</label>
                                <input type="range" className="w-full accent-cinema-accent h-1 bg-[#333] rounded-lg appearance-none" />
                            </div>
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400">Opacity</label>
                                <input type="range" className="w-full accent-cinema-accent h-1 bg-[#333] rounded-lg appearance-none" defaultValue="100"/>
                            </div>
                             <div className="pt-4 border-t border-[#333] space-y-2">
                                 <button className="w-full py-1.5 bg-[#222] hover:bg-red-900/50 text-red-400 text-xs rounded flex items-center justify-center gap-2">
                                     <Trash2 size={12} /> Delete Clip
                                 </button>
                             </div>
                         </>
                     ) : (
                         <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-2">
                             <Settings2 size={32} />
                             <p className="text-xs text-center">Select a clip to edit properties</p>
                         </div>
                     )}
                 </div>
            </div>

        </div>

        {/* Export Overlay */}
        {isExporting && (
             <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center">
                 <div className="bg-[#1a1a1a] p-8 rounded-2xl flex flex-col items-center gap-4 border border-[#333] shadow-2xl animate-fade-in-up">
                      <FancyLoader type="video" size="md" />
                      <h2 className="text-xl font-bold text-white">Rendering Video...</h2>
                      <p className="text-gray-400 text-sm">Merging {tracks.flatMap(t => t.clips).length} clips at 1080p / 60fps</p>
                      <div className="w-64 h-2 bg-[#333] rounded-full overflow-hidden mt-2">
                          <div className="h-full bg-cinema-accent animate-pulse w-2/3"></div>
                      </div>
                 </div>
             </div>
        )}

    </div>
  );
};

export default VideoEditorView;
