
import React, { useState, useRef } from 'react';
import { ArrowLeft, BookOpen, PenTool, Layout, Globe, Clapperboard, Wand2, User, Heart, Lightbulb, Copy, Upload, ChevronRight, FileText, Image as ImageIcon, ChevronDown, Sparkles, X, List, PlayCircle } from 'lucide-react';
import * as GeminiService from '../services/geminiService';
import { DeconstructionResult } from '../types';
import FancyLoader from './FancyLoader';

interface NovelWorkstationViewProps {
  onBack: () => void;
  onGoToComic?: (script: string) => void;
}

type WorkstationTab = 'deconstruct' | 'write' | 'script' | 'comic' | 'global';

const NOVEL_MODELS = [
    { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (最强)' },
    { id: 'gpt-5.2-pro', name: 'GPT-5.2 Pro' },
    { id: 'claude-opus-4-5-20251101-thinking', name: 'Claude Opus 4.5' },
    { id: 'deepseek-v3.2-thinking', name: 'DeepSeek V3.2' },
    { id: 'glm-4.7', name: 'GLM 4.7' },
    { id: 'doubao-seed-1-8-251228-thinking', name: 'Doubao Seed 1.8' },
    { id: 'qwen3-vl', name: 'Qwen 3 VL' }
];

const WRITING_TEMPLATES = [
    { label: "智能续写", value: "请根据上文逻辑和风格，续写接下来的剧情发展，字数800字左右。" },
    { label: "细致扩写", value: "请将这段大纲/情节进行深度扩写，增加环境渲染、动作细节和心理描写。" },
    { label: "文笔润色", value: "请优化这段文字的文笔，使其辞藻更华丽，更有代入感，保持原意不变。" },
    { label: "制造冲突", value: "请在接下来的情节中加入一个意想不到的反转或激烈的冲突，打破当前的平衡。" },
    { label: "情感升华", value: "着重描写主角此刻的内心纠葛和情感爆发，渲染出感人的氛围。" },
    { label: "场景构建", value: "详细描写当前所在的场景环境，包括光影、声音、气味等，营造独特的氛围。" },
    { label: "对话推动", value: "通过人物之间的对话来推动剧情发展，减少旁白，展现人物性格。" },
    { label: "第一人称视角", value: "请将这段内容改写为第一人称视角（我），增强主观体验。" }
];

const CREATION_WORKFLOWS = [
  {
    id: 'historical',
    name: '架空历史·经典爽文流',
    description: '适合宏大叙事、权谋争霸类题材',
    steps: [
      { label: 'Step 1: 设定构思', value: '请我设计几个「架空历史经典情节」的小说设定要求:\n1.情节要跌宕起伏\n2.主线要清晰明确\n3.人物形象要鲜明\n4.配角要脸谱化\n5.避免雷同套路。' },
      { label: 'Step 2: 设定分析', value: '请分析我选择的设定:\n1.核心卖点是什么?用一句话概括这个故事\n2.理清因果关系:开局设定如何成为后续伏笔?\n3.分析主角目标障碍解决路径。' },
      { label: 'Step 3: 大纲审查', value: '请审查这个大纲!\n1.故事是否生动?\n2.故事逻辑是否连贯?\n3.角色行为是否一致?\n4.有无情节漏洞?' },
      { label: 'Step 4: 角色创建', value: '请为我的小说创建以下角色!\n1. 6-8个主要角色(每个角色背景不超过150字)\n2.包含外貌、性格、历史和动机\n3.配角设计要简洁明了，容易识别\n小技巧:让主角有缺点让反派有闪光点，故事立刻丰富50%。' },
      { label: 'Step 5: 细纲制作', value: '请基于大纲制作细纲:\n1.每章节约2300字\n2.合理安排章节数量\n3.重点情节分布要均衡保持故事节奏感。' },
      { label: 'Step 6: 分卷规划', value: '请为第一卷规划具体章节:\n1.提供吸引人的章书标题\n2.每章重点内容和目标\n3.情节如何推动整体故事发展。' },
      { label: 'Step 7: 正文开篇', value: '请创作第1章，约3000字\n1.开场要吸引人\n2.设定故事背景\n3.引入主要角色埋下主要冲突伏笔。' }
    ]
  },
  {
    id: 'romance',
    name: '校园甜宠·百万字长篇',
    description: '适合18-22岁女性读者的轻松甜文',
    steps: [
      { label: 'Step 1: 故事大纲', value: '我想写一个符合18到22岁女性喜欢看的校园甜宠文，小说总字数100万字，文章分为10大卷，帮我生成一个故事大纲。' },
      { label: 'Step 2: 人物设计', value: '请按照以上故事大纲，帮我设计故事出场人物和主要任务背景设定，按照章节和故事发展顺序，以表格形式输出，人物性格鲜明。' },
      { label: 'Step 3: 分卷细化', value: '按照以上设定，将这本100万字的小说，每卷重新分配为20章，并重新生成第一卷大纲，大纲分为4个部分，每部分25章，先只列举出4个部分的大纲，简单介绍章节内容，按照表格形式输出。' },
      { label: 'Step 4: 章节列表', value: '按照以上设定，输出前5章的内容介绍以及起标题，并以表格形式输出。' },
      { label: 'Step 5: 正文撰写', value: '按照以上设定，输出第1章的内容，字数3000字左右，要有起承转合，结尾留有悬念.分段输出。' }
    ]
  }
];

const NovelWorkstationView: React.FC<NovelWorkstationViewProps> = ({ onBack, onGoToComic }) => {
  const [activeTab, setActiveTab] = useState<WorkstationTab>('deconstruct');
  const [text, setText] = useState('');
  const [instruction, setInstruction] = useState(''); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedModel, setSelectedModel] = useState(NOVEL_MODELS[0].id);
  const [instructionMode, setInstructionMode] = useState<'template' | 'workflow'>('template');
  const [activeWorkflowId, setActiveWorkflowId] = useState(CREATION_WORKFLOWS[0].id);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Results State
  const [deconstructionResult, setDeconstructionResult] = useState<DeconstructionResult | null>(null);
  const [writingResult, setWritingResult] = useState('');
  const [scriptResult, setScriptResult] = useState('');
  const [comicResult, setComicResult] = useState('');
  const [globalResult, setGlobalResult] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
              if (event.target?.result) setText(event.target.result as string);
          };
          reader.readAsText(file);
      }
  };

  const executeAction = async () => {
      if (!text.trim() && activeTab !== 'write') return; // Write mode allows empty text if starting new
      if (activeTab === 'write' && !instruction.trim() && !text.trim()) return;

      setIsProcessing(true);
      
      try {
          // Use different API calls/prompts based on tab
          if (activeTab === 'deconstruct') {
              const data = await GeminiService.deconstructBook(text, selectedModel);
              setDeconstructionResult(data);
          } else if (activeTab === 'write') {
              const userInstruction = instruction.trim() || "Please continue writing or polish this text.";
              // Allow context to be optional for first step of workflow
              const contextContent = text.trim() ? `Input Context:\n"${text.slice(0, 5000)}"` : "Context: Start from scratch based on instruction.";
              
              const prompt = `(Role: Professional Novelist) 
              
              Task: ${userInstruction}
              
              ${contextContent}
              
              Requirement: Return ONLY the novel content or analysis in Chinese. Maintain the style and tone suitable for the genre.`;
              
              const res = await GeminiService.generateRawText(prompt, selectedModel);
              setWritingResult(res);
          } else if (activeTab === 'script') {
              const prompt = `(Role: Screenwriter) Convert the following novel text into a standard screenplay format (Scene Heading, Action, Character, Dialogue). Return in Chinese. \n\nInput: ${text.slice(0, 5000)}`;
              const res = await GeminiService.generateRawText(prompt, selectedModel);
              setScriptResult(res);
          } else if (activeTab === 'comic') {
              const prompt = `(Role: Comic Editor) Break down the following novel text into a list of comic panels with visual descriptions. Format: [Panel 1] Visual: ..., Caption: ... \n\nInput: ${text.slice(0, 5000)}`;
              const res = await GeminiService.generateRawText(prompt, selectedModel);
              setComicResult(res);
          } else if (activeTab === 'global') {
              const prompt = `(Role: Translator) Translate the following webnovel chapter into English, optimizing for Western readers (Webnovel/Wattpad style). Keep terms consistent. \n\nInput: ${text.slice(0, 5000)}`;
              const res = await GeminiService.generateRawText(prompt, selectedModel);
              setGlobalResult(res);
          }
      } catch (e) {
          console.error(e);
          alert("处理失败，请重试");
      } finally {
          setIsProcessing(false);
      }
  };

  const copyToClipboard = (content: string) => {
      navigator.clipboard.writeText(content);
      alert("已复制到剪贴板");
  };

  return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col animate-fade-in">
          {/* Header */}
          <div className="h-16 border-b border-[#262626] bg-[#141414] px-6 flex items-center justify-between sticky top-0 z-50">
              <div className="flex items-center gap-4">
                  <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
                      <ArrowLeft size={20} />
                  </button>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                      <BookOpen className="text-orange-500" /> AI 小说创作中心
                  </h2>
              </div>
          </div>

          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              
              {/* Sidebar Tabs */}
              <div className="w-full lg:w-64 bg-[#111] border-b lg:border-b-0 lg:border-r border-[#262626] flex flex-row lg:flex-col p-2 lg:p-4 gap-2 overflow-x-auto lg:overflow-visible shrink-0">
                  <button 
                      onClick={() => setActiveTab('deconstruct')}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'deconstruct' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400 hover:bg-[#222] hover:text-white'}`}
                  >
                      <Wand2 size={18} /> 爆款拆书
                  </button>
                  <button 
                      onClick={() => setActiveTab('write')}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'write' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-[#222] hover:text-white'}`}
                  >
                      <PenTool size={18} /> 小说创作
                  </button>
                  <button 
                      onClick={() => setActiveTab('script')}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'script' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:bg-[#222] hover:text-white'}`}
                  >
                      <Clapperboard size={18} /> 小说转剧本
                  </button>
                  <button 
                      onClick={() => setActiveTab('comic')}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'comic' ? 'bg-pink-600 text-white shadow-lg' : 'text-gray-400 hover:bg-[#222] hover:text-white'}`}
                  >
                      <ImageIcon size={18} /> 小说转动漫
                  </button>
                  <button 
                      onClick={() => setActiveTab('global')}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'global' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400 hover:bg-[#222] hover:text-white'}`}
                  >
                      <Globe size={18} /> 小说出海
                  </button>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 p-4 lg:p-8 overflow-y-auto bg-[#0a0a0a] flex flex-col lg:flex-row gap-6">
                  
                  {/* Input Column */}
                  <div className="w-full lg:w-1/2 flex flex-col gap-4">
                      <div className="bg-[#171717] border border-[#262626] rounded-xl p-6 flex-1 flex flex-col shadow-lg min-h-[400px]">
                          <div className="flex items-center justify-between mb-4">
                              <label className="text-sm font-bold text-gray-300 flex items-center gap-2">
                                  <FileText size={16} className="text-orange-500" /> 输入小说/文本
                              </label>
                              <div className="flex gap-2">
                                  {/* Model Selector */}
                                  <div className="relative">
                                      <select 
                                          value={selectedModel}
                                          onChange={(e) => setSelectedModel(e.target.value)}
                                          className="appearance-none bg-[#222] border border-[#333] hover:border-gray-500 text-[10px] md:text-xs text-white px-3 py-1.5 pr-8 rounded-lg outline-none focus:border-orange-500 font-bold transition-colors cursor-pointer"
                                      >
                                          {NOVEL_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                      </select>
                                      <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                                  </div>

                                  <button 
                                      onClick={() => fileInputRef.current?.click()}
                                      className="text-[10px] md:text-xs flex items-center gap-1 bg-[#222] hover:bg-[#333] px-3 py-1.5 rounded-lg border border-[#333] transition-colors"
                                  >
                                      <Upload size={12} /> <span className="hidden sm:inline">导入</span>
                                      <input type="file" ref={fileInputRef} className="hidden" accept=".txt,.md" onChange={handleFileUpload}/>
                                  </button>
                              </div>
                          </div>
                          <textarea 
                              className={`flex-1 bg-[#0a0a0a] border border-[#333] rounded-lg p-4 text-sm text-gray-300 focus:outline-none focus:border-orange-500 resize-none leading-relaxed custom-scrollbar ${activeTab === 'write' ? 'min-h-[200px]' : 'min-h-[400px]'}`}
                              placeholder={
                                  activeTab === 'deconstruct' ? "输入全书或章节，拆解人物、情节与爽点..." :
                                  activeTab === 'write' ? "输入大纲或开头，AI 将为您续写..." :
                                  activeTab === 'script' ? "输入小说片段，转换为标准剧本格式..." :
                                  activeTab === 'comic' ? "输入故事，提取漫画分镜脚本..." :
                                  "输入中文小说，翻译为地道外语..."
                              }
                              value={text}
                              onChange={(e) => setText(e.target.value)}
                          />

                          {/* PRO WRITING INSTRUCTION PANEL (Only for Write Mode) */}
                          {activeTab === 'write' && (
                              <div className="mt-3 bg-[#0a0a0a] border border-[#333] rounded-lg p-3 animate-fade-in transition-all">
                                  {/* Toggle Header */}
                                  <div className="flex justify-between items-center mb-3">
                                      <label className="text-xs font-bold text-gray-400 flex items-center gap-1">
                                          <Sparkles size={12} className="text-blue-400" /> AI 创作指令 (Instructions)
                                      </label>
                                      <div className="flex bg-[#151515] rounded p-0.5 border border-[#333]">
                                          <button 
                                              onClick={() => setInstructionMode('template')}
                                              className={`px-3 py-1 text-[10px] rounded transition-all ${instructionMode === 'template' ? 'bg-[#333] text-white font-bold shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                                          >
                                              常用模板
                                          </button>
                                          <button 
                                              onClick={() => setInstructionMode('workflow')}
                                              className={`px-3 py-1 text-[10px] rounded transition-all flex items-center gap-1 ${instructionMode === 'workflow' ? 'bg-[#333] text-cinema-accent font-bold shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                                          >
                                              保姆式流程
                                          </button>
                                      </div>
                                  </div>
                                  
                                  {/* Mode Content */}
                                  {instructionMode === 'template' ? (
                                      <div className="flex flex-wrap gap-2 mb-3">
                                          {WRITING_TEMPLATES.map((t, i) => (
                                              <button 
                                                  key={i} 
                                                  onClick={() => setInstruction(t.value)}
                                                  className="px-2 py-1 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] rounded text-[10px] text-gray-400 hover:text-white transition-colors truncate max-w-[80px]"
                                                  title={t.value}
                                              >
                                                  {t.label}
                                              </button>
                                          ))}
                                      </div>
                                  ) : (
                                      <div className="mb-3 space-y-3">
                                          {/* Workflow Selector */}
                                          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-[#222]">
                                              {CREATION_WORKFLOWS.map(wf => (
                                                  <button
                                                      key={wf.id}
                                                      onClick={() => setActiveWorkflowId(wf.id)}
                                                      className={`px-3 py-1.5 rounded-t-lg text-[10px] whitespace-nowrap transition-colors border-b-2 ${activeWorkflowId === wf.id ? 'border-cinema-accent text-cinema-accent bg-[#151515]' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                                                  >
                                                      {wf.name}
                                                  </button>
                                              ))}
                                          </div>
                                          
                                          {/* Step Grid */}
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                                              {CREATION_WORKFLOWS.find(w => w.id === activeWorkflowId)?.steps.map((step, i) => (
                                                  <button
                                                      key={i}
                                                      onClick={() => setInstruction(step.value)}
                                                      className="text-left p-2.5 rounded bg-[#151515] hover:bg-[#222] border border-[#333] hover:border-cinema-accent/50 transition-all group relative"
                                                  >
                                                      <div className="flex items-center gap-2 mb-1">
                                                          <div className="w-4 h-4 rounded-full bg-[#222] border border-[#333] flex items-center justify-center text-[8px] text-gray-500 group-hover:text-cinema-accent group-hover:border-cinema-accent">
                                                              {i + 1}
                                                          </div>
                                                          <span className="text-[10px] font-bold text-gray-300 group-hover:text-white truncate">{step.label.split(':')[0]}</span>
                                                      </div>
                                                      <div className="text-[9px] text-gray-600 line-clamp-1 group-hover:text-gray-400">
                                                          {step.value}
                                                      </div>
                                                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                          <PlayCircle size={12} className="text-cinema-accent" />
                                                      </div>
                                                  </button>
                                              ))}
                                          </div>
                                      </div>
                                  )}

                                  {/* Instruction Input Area */}
                                  <div className="relative">
                                      <textarea 
                                          value={instruction}
                                          onChange={e => setInstruction(e.target.value)}
                                          placeholder={instructionMode === 'workflow' ? "点击上方步骤自动填入指令..." : "输入具体创作指令..."}
                                          className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none resize-none h-20 custom-scrollbar"
                                      />
                                      {instruction && (
                                          <button 
                                              onClick={() => setInstruction('')}
                                              className="absolute right-2 top-2 text-gray-500 hover:text-white p-1 hover:bg-[#222] rounded"
                                              title="Clear"
                                          >
                                              <X size={12} />
                                          </button>
                                      )}
                                  </div>
                              </div>
                          )}

                          <button 
                              onClick={executeAction}
                              disabled={isProcessing || (activeTab === 'write' && !instruction && !text)}
                              className={`mt-4 w-full py-3 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                                  activeTab === 'deconstruct' ? 'bg-orange-600 hover:bg-orange-500' :
                                  activeTab === 'write' ? 'bg-blue-600 hover:bg-blue-500' :
                                  activeTab === 'script' ? 'bg-purple-600 hover:bg-purple-500' :
                                  activeTab === 'comic' ? 'bg-pink-600 hover:bg-pink-500' :
                                  'bg-green-600 hover:bg-green-500'
                              }`}
                          >
                              {isProcessing ? <FancyLoader type="processing" size="sm" className="w-5 h-5" /> : <Wand2 size={18} />}
                              {isProcessing ? "正在智能处理..." : "开始执行"}
                          </button>
                      </div>
                  </div>

                  {/* Output Column */}
                  <div className="w-full lg:w-1/2 flex flex-col gap-4">
                      {/* DECONSTRUCTION RESULT */}
                      {activeTab === 'deconstruct' && deconstructionResult && (
                          <div className="bg-[#171717] border border-[#262626] rounded-xl p-6 shadow-xl space-y-6 animate-fade-in-up">
                              <h1 className="text-xl font-bold text-white border-b border-[#333] pb-2">{deconstructionResult.title}</h1>
                              <div className="space-y-4">
                                  <div className="p-4 bg-[#0a0a0a] rounded-lg border border-[#333]">
                                      <div className="flex items-center gap-2 mb-2 text-blue-400 font-bold text-sm"><User size={16} /> 人物设计</div>
                                      <div className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">{deconstructionResult.characterDesign}</div>
                                  </div>
                                  <div className="p-4 bg-[#0a0a0a] rounded-lg border border-[#333]">
                                      <div className="flex items-center gap-2 mb-2 text-green-400 font-bold text-sm"><Layout size={16} /> 情节设计</div>
                                      <div className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">{deconstructionResult.plotDesign}</div>
                                  </div>
                                  <div className="p-4 bg-[#0a0a0a] rounded-lg border border-[#333]">
                                      <div className="flex items-center gap-2 mb-2 text-pink-400 font-bold text-sm"><Heart size={16} /> 情绪拿捏</div>
                                      <div className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">{deconstructionResult.emotionalBeats}</div>
                                  </div>
                                  <div className="p-4 bg-gradient-to-br from-[#0a0a0a] to-orange-900/10 rounded-lg border border-orange-500/20">
                                      <div className="flex items-center gap-2 mb-2 text-orange-400 font-bold text-sm"><Lightbulb size={16} /> 仿写建议</div>
                                      <div className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{deconstructionResult.imitationSuggestions}</div>
                                  </div>
                              </div>
                          </div>
                      )}

                      {/* WRITING / SCRIPT / GLOBAL RESULT */}
                      {(activeTab === 'write' || activeTab === 'script' || activeTab === 'global') && (
                          <div className="bg-[#171717] border border-[#262626] rounded-xl p-6 shadow-xl flex-1 flex flex-col relative animate-fade-in-up">
                              <div className="flex justify-between items-center mb-4">
                                  <h3 className="font-bold text-white">AI 生成结果</h3>
                                  <button onClick={() => copyToClipboard(activeTab === 'write' ? writingResult : activeTab === 'script' ? scriptResult : globalResult)} className="text-gray-400 hover:text-white"><Copy size={16} /></button>
                              </div>
                              <textarea 
                                  readOnly
                                  className="flex-1 bg-[#0a0a0a] border border-[#333] rounded-lg p-4 text-sm text-gray-300 focus:outline-none resize-none leading-relaxed custom-scrollbar whitespace-pre-wrap"
                                  value={activeTab === 'write' ? writingResult : activeTab === 'script' ? scriptResult : globalResult}
                                  placeholder="结果将显示在这里..."
                              />
                          </div>
                      )}

                      {/* COMIC RESULT */}
                      {activeTab === 'comic' && (
                          <div className="bg-[#171717] border border-[#262626] rounded-xl p-6 shadow-xl flex-1 flex flex-col animate-fade-in-up">
                              <div className="flex justify-between items-center mb-4">
                                  <h3 className="font-bold text-white">漫画脚本提取</h3>
                                  {comicResult && onGoToComic && (
                                      <button 
                                          onClick={() => onGoToComic(comicResult)}
                                          className="px-3 py-1 bg-pink-600 hover:bg-pink-500 text-white text-xs rounded-full font-bold flex items-center gap-1 transition-colors"
                                      >
                                          去生成画面 <ChevronRight size={12} />
                                      </button>
                                  )}
                              </div>
                              <textarea 
                                  readOnly
                                  className="flex-1 bg-[#0a0a0a] border border-[#333] rounded-lg p-4 text-sm text-gray-300 focus:outline-none resize-none leading-relaxed custom-scrollbar whitespace-pre-wrap"
                                  value={comicResult}
                                  placeholder="AI 将提取分镜描述、对白和场景提示词..."
                              />
                          </div>
                      )}

                      {/* Placeholder when empty */}
                      {!isProcessing && !deconstructionResult && !writingResult && !scriptResult && !comicResult && !globalResult && (
                          <div className="flex-1 border border-dashed border-[#333] rounded-xl flex flex-col items-center justify-center text-gray-600 gap-4 min-h-[400px]">
                              <div className="w-20 h-20 bg-[#1a1a1a] rounded-full flex items-center justify-center">
                                  {activeTab === 'deconstruct' && <Wand2 size={32} />}
                                  {activeTab === 'write' && <PenTool size={32} />}
                                  {activeTab === 'script' && <Clapperboard size={32} />}
                                  {activeTab === 'comic' && <ImageIcon size={32} />}
                                  {activeTab === 'global' && <Globe size={32} />}
                              </div>
                              <p className="text-sm">在左侧输入内容并点击开始</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      </div>
  );
};

export default NovelWorkstationView;
