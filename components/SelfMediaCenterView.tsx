
import React, { useState } from 'react';
import { ArrowLeft, TrendingUp, Copy, Mic, Music, Link, FileText, Play, Download, Wand2, BarChart2, Radio, Check, X, AlertTriangle, BookOpen, PenTool, Lightbulb, Zap, Globe } from 'lucide-react';
import * as GeminiService from '../services/geminiService';
import FancyLoader from './FancyLoader';

interface SelfMediaCenterViewProps {
  onBack: () => void;
}

type MediaTab = 'rankings' | 'replica' | 'dubbing' | 'music' | 'parser' | 'transcript';

interface Novel {
    id: number;
    title: string;
    author: string;
    hot: number;
    trend: string;
    tag: string;
}

const SelfMediaCenterView: React.FC<SelfMediaCenterViewProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<MediaTab>('rankings');
  const [inputUrl, setInputUrl] = useState('');
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Imitation State
  const [showImitateModal, setShowImitateModal] = useState(false);
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);
  const [imitationResult, setImitationResult] = useState<string | null>(null);
  const [adjustmentPrompt, setAdjustmentPrompt] = useState('');
  const [outputLang, setOutputLang] = useState<'zh' | 'en'>('zh');

  // Rankings Mock Data
  const RANKINGS: Novel[] = [
      { id: 1, title: '道诡异仙', author: '狐尾的笔', hot: 9800, trend: '+12%', tag: '玄幻' },
      { id: 2, title: '灵境行者', author: '卖报小郎君', hot: 9500, trend: '+8%', tag: '科幻' },
      { id: 3, title: '深海余烬', author: '远瞳', hot: 9200, trend: '+5%', tag: '奇幻' },
      { id: 4, title: '宿命之环', author: '爱潜水的乌贼', hot: 8900, trend: '-2%', tag: '玄幻' },
      { id: 5, title: '赤心巡天', author: '情何以甚', hot: 8700, trend: '+15%', tag: '仙侠' },
  ];

  const handleNovelClick = (novel: Novel) => {
      setSelectedNovel(novel);
      setShowImitateModal(true);
  };

  const handleStartImitation = async () => {
      if (!selectedNovel) return;
      setShowImitateModal(false);
      setImitationResult(null); 
      setIsProcessing(true);
      
      const langInstruction = outputLang === 'zh' ? "全部改成中英双语默认使用全中文输出严格执行输出模式" : "Output in English.";

      // Construct the specialized prompt based on entropy reduction theory (A-F Model)
      const systemPrompt = `
      角色：金牌网文主编、大神作家
      任务：对热门小说《${selectedNovel.title}》（${selectedNovel.tag}类）进行深度拆解与一键仿写/改写。
      
      【核心创作理论 - 熵减构建法】
      请利用文本大模型对该小说进行分析解剖，打造黄金爆裂开头、黄金三章。
      核心逻辑：故事先从收获感和优越感开始，一步步往上累加提升到熵减（个人成就）+好奇心（制造悬念、埋伏笔→调动喜怒哀乐等情绪）+成就感（组织集体的荣耀成就），最后+求知欲（通过改变世界来满足自身欲望的实现，一般新人不用），一般百万字完成一次轮回后换地图再次轮回。

      【核心构建模型：熵减（将一件事从弱变强+装逼打脸）】
      请严格遵循以下 A-F 步骤进行构建仿写：
      
      A. 突发切入：通过切入一个突发事件设置清晰的目标（短期目标）。
      B. 情绪反应：主角现状 + 面对突发事件的情绪反应（符合读者现实认知）。
      C. 金手指与期待：得到金手指开始构建信息差，通过金手指这个必然路径进行实现目标的展望（长线期待）。
      D. 逼近目标：在明确路径上不断逼近目标的过程，刚开始不需要阻碍太多，故事展开后可以一波三折拉扯达成目标的成功率不断上下波动。
      E. 能力展现：将自已一路上不断逼近目标上取得的能力成就通过小事件展现。
      F. 打脸+收获（高潮）：主角实现最终目标后，各方视角下的前后对比：
         - 反派视角：从嚣张变为害怕、恐惧、悔恨、震惊不敢相信、跪舔。
         - 旁观者视角：从质疑变为认可、赞美、崇拜、喜欢。
         - 读者视角：从看主角遇到阻碍到解决反派、困难、问题、阻碍，收获物质 and 生理上的好处。
         - 主角视角：实现目标后个人满足感的表达。

      ${langInstruction}，可自行切换可随时指令调整创作过程。
      
      请输出以下内容（Markdown格式）：
      ## 1. 深度拆解分析
      分析《${selectedNovel.title}》的核心爽点与套路，以及它如何契合上述熵减逻辑。
      
      ## 2. 仿写大纲设计
      基于 A-F 模型，构思一个新的仿写故事大纲（黄金三章剧情点）。
      
      ## 3. 正文仿写（黄金爆裂开头）
      撰写第一章正文，确保黄金开局，钩子伏笔到位，严格执行 A/B/C 步骤，文字极具代入感。
      `;

      try {
          const res = await GeminiService.generateRawText(systemPrompt);
          setImitationResult(res);
      } catch (e: any) {
          console.error(e);
          alert("仿写生成失败: " + e.message);
      } finally {
          setIsProcessing(false);
      }
  };

  const handleAdjustImitation = async () => {
      if (!imitationResult || !adjustmentPrompt.trim()) return;
      setIsProcessing(true);
      
      const langInstruction = outputLang === 'zh' ? "严格执行：默认使用全中文输出。" : "Strictly execute: Output entirely in English.";

      const prompt = `
      基于上一次的仿写结果，请根据以下指令进行调整：
      "${adjustmentPrompt}"
      
      请保持“熵减构建法”和“A-F模型”的核心逻辑不变，输出修改后的内容。
      ${langInstruction}
      `;
      
      try {
          const res = await GeminiService.generateRawText(prompt);
          setImitationResult(res);
          setAdjustmentPrompt('');
      } catch (e: any) {
          alert("调整失败: " + e.message);
      } finally {
          setIsProcessing(false);
      }
  };

  const handleAction = async () => {
      setIsProcessing(true);
      setResult(null);
      
      try {
          if (activeTab === 'replica') {
              const script = await GeminiService.generateRawText(`Analyze this video style and generate a shooting script for a similar viral video.`);
              setResult({ type: 'text', content: script });
          } else {
              await new Promise(resolve => setTimeout(resolve, 2000));
              setResult({ type: 'text', content: 'Action completed (Simulation Mode)' });
          }
      } catch (e: any) {
          console.error(e);
          alert("操作失败: " + e.message);
      } finally {
          setIsProcessing(false);
      }
  };

  return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col animate-fade-in relative">
          {/* Header */}
          <div className="h-16 border-b border-[#262626] bg-[#141414] px-6 flex items-center justify-between sticky top-0 z-50">
              <div className="flex items-center gap-4">
                  <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
                      <ArrowLeft size={20} />
                  </button>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                      <TrendingUp className="text-cyan-500" /> 自媒体运营中心
                  </h2>
              </div>
          </div>

          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              
              {/* Sidebar Tabs */}
              <div className="w-full lg:w-64 bg-[#111] border-b lg:border-b-0 lg:border-r border-[#262626] flex flex-row lg:flex-col p-2 lg:p-4 gap-2 overflow-x-auto lg:overflow-visible shrink-0">
                  <button onClick={() => setActiveTab('rankings')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'rankings' ? 'bg-cyan-600 text-white shadow-lg' : 'text-gray-400 hover:bg-[#222] hover:text-white'}`}>
                      <BarChart2 size={18} /> 全网小说榜
                  </button>
                  <button onClick={() => setActiveTab('replica')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'replica' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:bg-[#222] hover:text-white'}`}>
                      <Copy size={18} /> 爆款视频复刻
                  </button>
                  <button onClick={() => setActiveTab('dubbing')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'dubbing' ? 'bg-pink-600 text-white shadow-lg' : 'text-gray-400 hover:bg-[#222] hover:text-white'}`}>
                      <Mic size={18} /> 配音工作室
                  </button>
                  <button onClick={() => setActiveTab('music')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'music' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-[#222] hover:text-white'}`}>
                      <Music size={18} /> 音乐创作室
                  </button>
                  <button onClick={() => setActiveTab('parser')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'parser' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400 hover:bg-[#222] hover:text-white'}`}>
                      <Link size={18} /> 全网视频解析
                  </button>
                  <button onClick={() => setActiveTab('transcript')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'transcript' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400 hover:bg-[#222] hover:text-white'}`}>
                      <FileText size={18} /> 视频文案提取
                  </button>
              </div>

              {/* Main Content */}
              <div className="flex-1 p-6 lg:p-10 overflow-y-auto bg-[#0a0a0a]">
                  
                  {/* Rankings View */}
                  {activeTab === 'rankings' && (
                      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
                          
                          {/* Banner */}
                          <div className="bg-gradient-to-r from-cyan-900/40 to-blue-900/40 p-6 rounded-2xl border border-cyan-500/20">
                              <h2 className="text-2xl font-bold text-white mb-2">🔥 全网小说风向标</h2>
                              <p className="text-gray-400 text-sm">实时抓取全网热门网文。点击小说名，AI 导演为您深度拆解并仿写黄金三章。</p>
                          </div>

                          {/* IMITATION WORKSPACE (Replaces list when active) */}
                          {(imitationResult || isProcessing) ? (
                              <div className="bg-[#171717] border border-[#262626] rounded-2xl p-6 shadow-2xl animate-fade-in">
                                  <div className="flex justify-between items-center mb-6 border-b border-[#333] pb-4">
                                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                          <Wand2 className="text-cyan-500" /> 
                                          {selectedNovel ? `《${selectedNovel.title}》熵减仿写工作区` : "AI 仿写生成中"}
                                      </h3>
                                      <div className="flex items-center gap-3">
                                          <button 
                                              onClick={() => setOutputLang(prev => prev === 'zh' ? 'en' : 'zh')}
                                              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-[#222] hover:bg-[#333] border border-[#444] text-gray-300 transition-colors"
                                          >
                                              <Globe size={12} /> {outputLang === 'zh' ? '中文输出' : 'English Output'}
                                          </button>
                                          <div className="h-4 w-px bg-[#333]"></div>
                                          <button 
                                              onClick={() => { setImitationResult(null); setIsProcessing(false); }} 
                                              className="text-gray-400 hover:text-white flex items-center gap-1 text-sm"
                                          >
                                              <X size={16} /> 关闭
                                          </button>
                                      </div>
                                  </div>

                                  {isProcessing ? (
                                      <div className="flex flex-col items-center justify-center py-20 gap-6">
                                          <FancyLoader type="analyzing" size="lg" text="正在拆解核心爽点..." />
                                          <div className="text-gray-500 text-sm font-mono space-y-1 text-center">
                                              <p>正在分析熵减构建逻辑...</p>
                                              <p>正在搭建 A-F 黄金模型...</p>
                                              <p>正在生成多视角打脸伏笔...</p>
                                          </div>
                                      </div>
                                  ) : (
                                      <div className="flex flex-col h-[60vh]">
                                          <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0a0a0a] rounded-xl p-6 mb-4 border border-[#333] shadow-inner">
                                              <div className="prose prose-invert max-w-none prose-sm leading-relaxed whitespace-pre-wrap text-gray-300">
                                                  {imitationResult}
                                              </div>
                                          </div>
                                          
                                          {/* Adjustment Bar */}
                                          <div className="flex gap-2 bg-[#0a0a0a] p-2 rounded-xl border border-[#333]">
                                              <input 
                                                  type="text" 
                                                  value={adjustmentPrompt}
                                                  onChange={(e) => setAdjustmentPrompt(e.target.value)}
                                                  placeholder="输入调整指令，例如：'加强反派被打脸后的悔恨描写' 或 '节奏再快一点'..."
                                                  className="flex-1 bg-transparent px-4 py-2 text-sm text-white focus:outline-none"
                                                  onKeyDown={(e) => e.key === 'Enter' && handleAdjustImitation()}
                                              />
                                              <button 
                                                  onClick={handleAdjustImitation}
                                                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                                              >
                                                  <Zap size={14} /> 调整创作
                                              </button>
                                          </div>
                                      </div>
                                  )}
                              </div>
                          ) : (
                              // Normal List
                              <div className="grid gap-4">
                                  {RANKINGS.map((book, index) => (
                                      <div 
                                          key={book.id} 
                                          onClick={() => handleNovelClick(book)}
                                          className="bg-[#171717] border border-[#262626] p-4 rounded-xl flex items-center justify-between hover:border-cyan-500/50 hover:bg-[#1a1a1a] transition-all cursor-pointer group"
                                      >
                                          <div className="flex items-center gap-6">
                                              <span className={`text-2xl font-bold w-8 text-center ${index < 3 ? 'text-cyan-400' : 'text-gray-600'}`}>0{index + 1}</span>
                                              <div>
                                                  <h3 className="font-bold text-white text-lg group-hover:text-cyan-400 transition-colors">{book.title}</h3>
                                                  <div className="flex gap-3 text-xs text-gray-500 mt-1">
                                                      <span>{book.author}</span>
                                                      <span className="bg-[#222] px-1.5 rounded text-gray-400">{book.tag}</span>
                                                  </div>
                                              </div>
                                          </div>
                                          <div className="text-right">
                                              <div className="text-orange-500 font-bold text-lg">{book.hot} 🔥</div>
                                              <div className={`text-xs ${book.trend.startsWith('+') ? 'text-red-400' : 'text-green-400'}`}>{book.trend}</div>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>
                  )}

                  {/* Input-Based Tools */}
                  {activeTab !== 'rankings' && (
                      <div className="max-w-3xl mx-auto flex flex-col gap-6 animate-fade-in-up">
                          <div className="bg-[#171717] border border-[#262626] rounded-2xl p-6 shadow-xl">
                              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                  {activeTab === 'replica' && <Copy className="text-purple-500"/>}
                                  {activeTab === 'dubbing' && <Mic className="text-pink-500"/>}
                                  {activeTab === 'music' && <Music className="text-blue-500"/>}
                                  {activeTab === 'parser' && <Link className="text-green-500"/>}
                                  {activeTab === 'transcript' && <FileText className="text-orange-500"/>}
                                  请输入处理内容
                              </h2>
                              
                              {(activeTab === 'replica' || activeTab === 'parser' || activeTab === 'transcript') && (
                                  <div className="mb-6">
                                      <label className="text-sm font-bold text-gray-300 mb-2 block">链接地址</label>
                                      <input 
                                          type="text" 
                                          className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                                          placeholder="粘贴视频或主页链接..."
                                          value={inputUrl}
                                          onChange={(e) => setInputUrl(e.target.value)}
                                      />
                                  </div>
                              )}

                              {(activeTab === 'dubbing' || activeTab === 'music') && (
                                  <div className="mb-6">
                                      <label className="text-sm font-bold text-gray-300 mb-2 block">文本内容</label>
                                      <textarea 
                                          className="w-full h-32 bg-[#0a0a0a] border border-[#333] rounded-xl p-4 text-white focus:border-cyan-500 focus:outline-none resize-none"
                                          placeholder="输入需要处理的文字..."
                                          value={inputText}
                                          onChange={(e) => setInputText(e.target.value)}
                                      />
                                  </div>
                              )}

                              <button 
                                  onClick={handleAction}
                                  disabled={isProcessing}
                                  className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:brightness-110 ${
                                      activeTab === 'replica' ? 'bg-purple-600' :
                                      activeTab === 'dubbing' ? 'bg-pink-600' :
                                      activeTab === 'music' ? 'bg-blue-600' :
                                      activeTab === 'parser' ? 'bg-green-600' :
                                      'bg-orange-600'
                                  }`}
                              >
                                  {isProcessing ? <FancyLoader type="processing" size="sm" className="w-6 h-6" /> : <Wand2 size={20} />}
                                  {isProcessing ? "处理中..." : "开始执行"}
                              </button>
                          </div>
                      </div>
                  )}

              </div>

              {/* IMITATION CONFIRM MODAL */}
              {showImitateModal && selectedNovel && (
                  <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowImitateModal(false)}>
                      <div className="bg-[#171717] border border-[#262626] w-full max-w-md rounded-2xl shadow-2xl p-6 transform scale-100" onClick={e => e.stopPropagation()}>
                          <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                  <div className="p-3 bg-cyan-900/30 rounded-xl text-cyan-400 border border-cyan-500/30">
                                      <PenTool size={24} />
                                  </div>
                                  <div>
                                      <h3 className="text-lg font-bold text-white">一键仿写确认</h3>
                                      <p className="text-xs text-gray-400">目标: 《{selectedNovel.title}》</p>
                                  </div>
                              </div>
                              <button onClick={() => setShowImitateModal(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
                          </div>
                          
                          <div className="bg-[#0a0a0a] p-4 rounded-xl border border-[#333] mb-6 space-y-3">
                              <p className="text-sm text-gray-300 leading-relaxed">
                                  是否对该小说进行深度仿写？AI 将基于 <span className="text-cyan-400 font-bold">熵减构建法</span> 与 <span className="text-cyan-400 font-bold">黄金三章 A-F 模型</span> 理论，为您自动产出极具代入感的爆款开头。
                              </p>
                              <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500">
                                  <div className="flex items-center gap-1"><Check size={10} className="text-green-500"/> 拆解核心爽点</div>
                                  <div className="flex items-center gap-1"><Check size={10} className="text-green-500"/> 生成黄金开头</div>
                                  <div className="flex items-center gap-1"><Check size={10} className="text-green-500"/> 预埋打脸伏笔</div>
                                  <div className="flex items-center gap-1"><Check size={10} className="text-green-500"/> 规划熵减路径</div>
                              </div>
                          </div>

                          <div className="flex gap-3">
                              <button 
                                  onClick={() => setShowImitateModal(false)}
                                  className="flex-1 py-3 rounded-xl border border-[#333] text-gray-400 font-bold text-sm hover:bg-[#222] transition-colors"
                              >
                                  取消
                              </button>
                              <button 
                                  onClick={handleStartImitation}
                                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-sm hover:brightness-110 shadow-lg flex items-center justify-center gap-2"
                              >
                                  <Wand2 size={16} /> 确认仿写
                              </button>
                          </div>
                      </div>
                  </div>
              )}

          </div>
      </div>
  );
};

export default SelfMediaCenterView;
