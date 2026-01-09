
import React, { useState, useRef } from 'react';
import { ArrowLeft, BookOpen, Upload, Wand2, FileText, User, Heart, PenTool, Layout, Lightbulb, Copy } from 'lucide-react';
import * as GeminiService from '../services/geminiService';
import { DeconstructionResult } from '../types';
import FancyLoader from './FancyLoader';

interface BookDeconstructionViewProps {
  onBack: () => void;
}

const BookDeconstructionView: React.FC<BookDeconstructionViewProps> = ({ onBack }) => {
  const [text, setText] = useState('');
  const [result, setResult] = useState<DeconstructionResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleAnalyze = async () => {
      if (!text.trim()) return;
      setIsAnalyzing(true);
      try {
          const data = await GeminiService.deconstructBook(text);
          setResult(data);
      } catch (e) {
          alert("拆解失败，请重试");
      } finally {
          setIsAnalyzing(false);
      }
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
                      <BookOpen className="text-amber-500" /> AI 爆款拆书
                  </h2>
              </div>
          </div>

          <div className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-6">
              {/* Left: Input */}
              <div className={`w-full ${result ? 'lg:w-1/3' : 'lg:w-1/2 mx-auto'} transition-all duration-500 flex flex-col gap-4`}>
                  <div className="bg-[#171717] border border-[#262626] rounded-xl p-6 flex-1 flex flex-col shadow-lg">
                      <div className="flex items-center justify-between mb-4">
                          <label className="text-sm font-bold text-gray-300">输入小说/文本内容</label>
                          <button 
                              onClick={() => fileInputRef.current?.click()}
                              className="text-xs flex items-center gap-1 bg-[#222] hover:bg-[#333] px-3 py-1.5 rounded-lg border border-[#333] transition-colors"
                          >
                              <Upload size={12} /> 导入文件
                              <input type="file" ref={fileInputRef} className="hidden" accept=".txt,.md" onChange={handleFileUpload}/>
                          </button>
                      </div>
                      <textarea 
                          className="flex-1 bg-[#0a0a0a] border border-[#333] rounded-lg p-4 text-sm text-gray-300 focus:outline-none focus:border-amber-500 resize-none leading-relaxed custom-scrollbar min-h-[400px]"
                          placeholder="粘贴小说章节或全书内容..."
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                      />
                      <button 
                          onClick={handleAnalyze}
                          disabled={isAnalyzing || !text.trim()}
                          className="mt-4 w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          {isAnalyzing ? <FancyLoader type="analyzing" size="sm" className="w-5 h-5" /> : <Wand2 size={18} />}
                          {isAnalyzing ? "正在深度拆解..." : "开始拆解"}
                      </button>
                  </div>
              </div>

              {/* Right: Result */}
              {result && (
                  <div className="w-full lg:w-2/3 animate-fade-in-up space-y-6">
                      <div className="bg-[#171717] border border-[#262626] rounded-xl p-6 shadow-xl">
                          <h1 className="text-2xl font-bold text-white mb-2">{result.title}</h1>
                          <div className="h-1 w-20 bg-amber-500 rounded-full mb-6"></div>

                          <div className="grid grid-cols-1 gap-6">
                              {/* Character */}
                              <div className="bg-[#0a0a0a] border border-[#333] rounded-xl p-5 hover:border-blue-500/50 transition-colors">
                                  <div className="flex items-center gap-2 mb-3 text-blue-400 font-bold text-lg">
                                      <User size={20} /> 人物设计 (Character)
                                  </div>
                                  <div className="text-gray-300 text-sm leading-7 whitespace-pre-wrap">{result.characterDesign}</div>
                              </div>

                              {/* Plot */}
                              <div className="bg-[#0a0a0a] border border-[#333] rounded-xl p-5 hover:border-green-500/50 transition-colors">
                                  <div className="flex items-center gap-2 mb-3 text-green-400 font-bold text-lg">
                                      <Layout size={20} /> 情节设计 (Plot)
                                  </div>
                                  <div className="text-gray-300 text-sm leading-7 whitespace-pre-wrap">{result.plotDesign}</div>
                              </div>

                              {/* Emotion */}
                              <div className="bg-[#0a0a0a] border border-[#333] rounded-xl p-5 hover:border-pink-500/50 transition-colors">
                                  <div className="flex items-center gap-2 mb-3 text-pink-400 font-bold text-lg">
                                      <Heart size={20} /> 拿捏读者情绪 (Emotion)
                                  </div>
                                  <div className="text-gray-300 text-sm leading-7 whitespace-pre-wrap">{result.emotionalBeats}</div>
                              </div>

                              {/* Imitation */}
                              <div className="bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] border border-amber-500/30 rounded-xl p-5 relative overflow-hidden">
                                  <div className="absolute top-0 right-0 p-4 opacity-10">
                                      <PenTool size={100} className="text-amber-500" />
                                  </div>
                                  <div className="flex items-center gap-2 mb-3 text-amber-400 font-bold text-lg relative z-10">
                                      <Lightbulb size={20} /> 仿写建议 (Imitation)
                                  </div>
                                  <div className="text-gray-200 text-sm leading-7 whitespace-pre-wrap relative z-10 bg-amber-900/10 p-4 rounded-lg border border-amber-500/20">
                                      {result.imitationSuggestions}
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      </div>
  );
};

export default BookDeconstructionView;
