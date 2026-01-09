
import React, { useState, useEffect, useRef } from 'react';
import { Settings, Save, X, Link, Key, Box, Activity, Server, ExternalLink, Info, Video, CloudLightning, Database, Copy, Check, Lock, Share2, Palette, CreditCard, Shield, Users, Crown, FileText, ChevronDown, Globe } from 'lucide-react';
import { ApiConfig } from '../types';
import * as GeminiService from '../services/geminiService';

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: ApiConfig) => void;
  initialConfig: ApiConfig;
}

const PROVIDERS = [
    {
        key: 'yunwu', // Keeping key 'yunwu' for compatibility, labeling as Bale
        label: '芭乐API (Bale)',
        tip: '性价比高/高并发推荐',
        url: 'https://baleai.de5.net/register?aff=aZWA',
        baseUrl: 'https://baleai.de5.net/v1',
        color: 'bg-green-600 text-white',
        hoverColor: 'hover:bg-green-500'
    },
    {
        key: 't8star',
        label: 'T8Star (New)',
        tip: '模型全/新模型首发',
        url: 'https://ai.t8star.cn/register?aff=Zp0w64090',
        baseUrl: 'https://ai.t8star.cn/v1',
        color: 'bg-blue-600 text-white',
        hoverColor: 'hover:bg-blue-500'
    },
    {
        key: 'tuzi',
        label: '兔子API (Tuzi)',
        tip: '高并发/多模型聚合',
        url: 'https://api.tu-zi.com/register?aff=XQzi',
        baseUrl: 'https://api.tu-zi.com/v1',
        color: 'bg-pink-600 text-white',
        hoverColor: 'hover:bg-pink-500'
    },
    {
        key: 'gemini',
        label: 'Gemini (直连)',
        tip: '速度快但模型少',
        url: 'https://aistudio.google.com/',
        baseUrl: 'https://generativelanguage.googleapis.com',
        color: 'bg-[#333]',
        hoverColor: 'hover:bg-[#444]'
    }
] as const;

const ApiConfigModal: React.FC<ApiConfigModalProps> = ({ isOpen, onClose, onSave, initialConfig }) => {
  const [config, setConfig] = useState<ApiConfig>(initialConfig);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'model' | 'backend'>('model');
  const [showApiDocs, setShowApiDocs] = useState(false);
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [isProviderOpen, setIsProviderOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initial state logic to populate providerSettings from initialConfig.providers if available
  const getInitialSettings = (key: string, defaultBase: string) => {
      const saved = initialConfig.providers?.[key];
      if (saved) return saved;
      // Fallback: if current provider matches, use root keys
      if (initialConfig.provider === key) {
          return {
              baseUrl: initialConfig.baseUrl,
              apiKey: initialConfig.apiKey,
              textModel: initialConfig.textModel,
              imageModel: initialConfig.imageModel,
              videoModel: initialConfig.videoModel
          };
      }
      return {
          baseUrl: defaultBase,
          apiKey: "",
          textModel: "gpt-4o",
          imageModel: "dall-e-3",
          videoModel: "sora-2"
      };
  };

  const [providerSettings, setProviderSettings] = useState<any>({});

  useEffect(() => {
    if (isOpen) {
        setConfig(initialConfig);
        // Initialize settings map
        setProviderSettings({
            gemini: getInitialSettings('gemini', "https://grsai.dakka.com.cn"),
            yunwu: getInitialSettings('yunwu', "https://baleai.de5.net/v1"),
            t8star: getInitialSettings('t8star', "https://ai.t8star.cn/v1"),
            tuzi: getInitialSettings('tuzi', "https://api.tu-zi.com/v1")
        });
        setTestResult(null);
    }
  }, [isOpen, initialConfig]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProviderOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleChange = (key: keyof ApiConfig, value: any) => {
    setConfig(prev => {
        const newConfig = { ...prev, [key]: value };
        // Sync to providerSettings
        if (key !== 'enableBackend' && key !== 'backendUrl' && key !== 'provider') {
             setProviderSettings((p: any) => ({
                ...p,
                [prev.provider]: {
                    ...p[prev.provider],
                    [key]: value
                }
            }));
        }
        return newConfig;
    });
    setTestResult(null); 
  };

  const handleProviderChange = (newProvider: 'gemini' | 'yunwu' | 't8star' | 'tuzi') => {
      const settings = providerSettings[newProvider];
      // When switching, load settings from storage
      setConfig(prev => ({
          ...prev,
          provider: newProvider,
          baseUrl: settings.baseUrl,
          apiKey: settings.apiKey,
          textModel: settings.textModel || "gpt-4o",
          imageModel: settings.imageModel || "dall-e-3",
          videoModel: settings.videoModel || "sora-2"
      }));
      setTestResult(null);
      setIsProviderOpen(false);
  };

  const handleTestConnection = async () => {
    if (!config.baseUrl) {
        setTestResult({ success: false, msg: "Please enter API URL." });
        return;
    }

    setIsTesting(true);
    setTestResult(null);
    GeminiService.setApiConfig(config);

    try {
        await GeminiService.generateTextTest();
        setTestResult({ success: true, msg: "AI 模型连接成功" });
    } catch (e: any) {
        setTestResult({ success: false, msg: `连接失败: ${e.message}` });
    } finally {
        setIsTesting(false);
    }
  };

  const handleTestBackend = async () => {
      if (!config.backendUrl) return;
      setIsTesting(true);
      setTestResult(null);
      try {
          const res = await fetch(config.backendUrl.replace(/\/api\/?$/, '') + '/health', { method: 'GET' }).catch(() => null);
          try {
            await fetch(`${config.backendUrl}/auth/login`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: 'ping' })
            });
            setTestResult({ success: true, msg: "后端接口可连接" });
          } catch(e) {
             throw new Error("无法连接到服务器");
          }
      } catch (e: any) {
          setTestResult({ success: false, msg: "连接失败: 请检查 URL" });
      } finally {
          setIsTesting(false);
      }
  };

  const handleSave = () => {
      // Pack all settings into config.providers for persistence
      const newConfig = {
          ...config,
          providers: providerSettings
      };
      onSave(newConfig);
  };

  const currentProvider = PROVIDERS.find(p => p.key === config.provider) || PROVIDERS[0];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fade-in font-sans">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-[#121212] w-full max-w-lg border border-[#262626] rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Style for Marquee */}
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
          .animate-marquee {
            animation: marquee 20s linear infinite;
            white-space: nowrap;
          }
        `}</style>

        {/* Header */}
        <div className="h-16 border-b border-[#262626] flex items-center justify-between px-6 bg-[#171717] shrink-0 relative z-20">
            <div className="flex items-center gap-3">
                <div className="bg-cinema-accent text-black p-1.5 rounded">
                    <Settings size={20} />
                </div>
                <h2 className="text-xl font-bold text-white">系统配置</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
            </button>
        </div>

        {/* Scrolling Announcement */}
        <div className="bg-yellow-900/20 border-b border-yellow-500/10 overflow-hidden relative h-7 flex items-center shrink-0">
            <div className="animate-marquee text-[10px] text-yellow-500 font-mono absolute w-full">
                API平台自行注册对接，对应模型名称自行更换即可调用，有任何问题请联系客服QQ：1400545582
            </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#262626] bg-[#1a1a1a] shrink-0">
            <button 
                onClick={() => setActiveTab('model')}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'model' ? 'border-cinema-accent text-white bg-[#222]' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
                <Server size={14} /> 模型接入
            </button>
            <button 
                onClick={() => setActiveTab('backend')}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'backend' ? 'border-cinema-accent text-white bg-[#222]' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
                <Database size={14} /> 后端/SaaS
            </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar relative">

            {activeTab === 'model' && (
                <>
                    {/* Provider Dropdown */}
                    <div className="space-y-2 relative" ref={dropdownRef}>
                        <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                            <CloudLightning size={14} /> API 提供商 (Provider)
                        </label>
                        
                        <div 
                            className={`w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer hover:border-cinema-accent transition-colors ${isProviderOpen ? 'border-cinema-accent' : ''}`}
                            onClick={() => setIsProviderOpen(!isProviderOpen)}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${currentProvider.color.split(' ')[0]}`}></div>
                                <div>
                                    <div className="text-sm font-bold text-white">{currentProvider.label}</div>
                                    <div className="text-[10px] text-gray-500">{currentProvider.tip}</div>
                                </div>
                            </div>
                            <ChevronDown size={16} className={`text-gray-500 transition-transform ${isProviderOpen ? 'rotate-180' : ''}`} />
                        </div>

                        {/* Dropdown Menu */}
                        {isProviderOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-[#333] rounded-xl shadow-2xl z-30 overflow-hidden animate-fade-in-up">
                                {PROVIDERS.map((p) => (
                                    <button 
                                        key={p.key}
                                        onClick={() => handleProviderChange(p.key as any)}
                                        className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-[#252525] transition-colors text-left border-b border-[#222] last:border-0 ${config.provider === p.key ? 'bg-[#222]' : ''}`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${p.color.split(' ')[0]}`}></div>
                                        <div className="flex-1">
                                            <div className={`text-sm font-bold ${config.provider === p.key ? 'text-cinema-accent' : 'text-gray-300'}`}>{p.label}</div>
                                            <div className="text-[10px] text-gray-500">{p.tip}</div>
                                        </div>
                                        {config.provider === p.key && <Check size={14} className="text-cinema-accent" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {/* API URL + Application Link */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                                <Link size={14} /> API 地址 (Base URL)
                            </label>
                            <button 
                                onClick={() => setShowLinksModal(true)}
                                className="text-[10px] text-cinema-accent hover:text-white flex items-center gap-1 bg-cinema-accent/10 px-2 py-0.5 rounded border border-cinema-accent/30 hover:border-cinema-accent transition-colors"
                            >
                                <ExternalLink size={10} /> 申请 API Key
                            </button>
                        </div>
                        <input 
                            type="text" 
                            value={config.baseUrl}
                            onChange={(e) => handleChange('baseUrl', e.target.value)}
                            placeholder="https://..."
                            className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-sm text-white focus:border-cinema-accent focus:outline-none font-mono"
                        />
                    </div>

                    {/* API Key Input - Restored */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                            <Key size={14} /> API Key (sk-...)
                        </label>
                        <div className="relative">
                            <input 
                                type="password" 
                                value={config.apiKey}
                                onChange={(e) => handleChange('apiKey', e.target.value)}
                                placeholder="sk-..."
                                className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-sm text-white focus:border-cinema-accent focus:outline-none font-mono"
                            />
                        </div>
                    </div>

                    <div className="h-px bg-[#262626] my-2"></div>
                    
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                                <Box size={14} /> 文本模型名称 (Text Model)
                            </label>
                            <input 
                                type="text" 
                                value={config.textModel}
                                onChange={(e) => handleChange('textModel', e.target.value)}
                                className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-sm text-white focus:border-cinema-accent focus:outline-none font-mono"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                                <Box size={14} /> 图片模型名称 (Image Model)
                            </label>
                            <input 
                                type="text" 
                                value={config.imageModel}
                                onChange={(e) => handleChange('imageModel', e.target.value)}
                                className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-sm text-white focus:border-cinema-accent focus:outline-none font-mono"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                                <Video size={14} /> 视频模型 (Video Model)
                            </label>
                            <input 
                                type="text" 
                                value={config.videoModel}
                                onChange={(e) => handleChange('videoModel', e.target.value)}
                                className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-sm text-white focus:border-cinema-accent focus:outline-none font-mono"
                            />
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'backend' && (
                <div className="space-y-6">
                    <div className="bg-[#1a1a1a] p-4 rounded-xl border border-[#333]">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-bold text-white flex items-center gap-2">
                                <CloudLightning size={16} className={config.enableBackend ? "text-green-500" : "text-gray-500"} />
                                启用 SaaS 后端/代理
                            </label>
                            <button 
                                onClick={() => handleChange('enableBackend', !config.enableBackend)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${config.enableBackend ? 'bg-green-600' : 'bg-[#333]'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${config.enableBackend ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            开启后，前端将连接到您的私有服务器。<br/>
                            支持：<span className="text-white">注册登录、会员支付、推广裂变、UI 动态配置</span>。
                        </p>
                    </div>

                    <div className={`space-y-2 transition-opacity ${config.enableBackend ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                        <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                            <Link size={14} /> 后端接口地址 (Backend URL)
                        </label>
                        <input 
                            type="text" 
                            value={config.backendUrl || ''}
                            onChange={(e) => handleChange('backendUrl', e.target.value)}
                            placeholder="e.g. https://<jeata-app-id>.next.bspapp.com/api"
                            className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-sm text-white focus:border-green-500 focus:outline-none font-mono"
                        />
                        <p className="text-[10px] text-gray-500">
                            * 如果使用 <span className="text-green-400 font-bold">Jeata Cloud</span>，请填写您的云函数 HTTP URL 化地址。
                        </p>
                    </div>

                    {/* API Spec Documentation - Moved OUTSIDE the disabled container */}
                    <div className="bg-blue-900/10 p-3 rounded-lg border border-blue-500/20 text-xs">
                        <div className="flex items-center justify-between mb-2">
                            <strong className="text-blue-300 flex items-center gap-2"><Info size={14}/> SaaS 完整对接协议 (Api Spec v2.0)</strong>
                            <button 
                                onClick={() => setShowApiDocs(!showApiDocs)}
                                className="text-blue-400 underline hover:text-blue-300 cursor-pointer"
                            >
                                {showApiDocs ? '收起' : '查看完整文档'}
                            </button>
                        </div>
                        
                        {showApiDocs ? (
                            <div className="space-y-4 mt-2 border-t border-blue-500/10 pt-2 text-gray-400 animate-fade-in max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                
                                {/* 1. Auth & Viral */}
                                <div className="space-y-1">
                                    <div className="text-white font-bold flex items-center gap-2"><Shield size={12}/> 注册登录与裂变 (Auth & Growth)</div>
                                    <div className="bg-[#111] p-2 rounded font-mono text-gray-300 break-all border-l-2 border-blue-500">
                                        POST /auth/login (Body: username, password)<br/>
                                        POST /auth/register (Body: username, password, inviteCode)<br/>
                                        <div className="h-px bg-white/10 my-1"></div>
                                        GET /user/invite-info (Header: Auth)<br/>
                                        Resp: &#123; "code": "ABC", "count": 5, "reward": 100 &#125;
                                    </div>
                                </div>

                                {/* 2. DIY & Config */}
                                <div className="space-y-1">
                                    <div className="text-white font-bold flex items-center gap-2"><Palette size={12}/> 动态配置 (Frontend DIY)</div>
                                    <div className="bg-[#111] p-2 rounded font-mono text-gray-300 break-all border-l-2 border-pink-500">
                                        GET /system/ui-config<br/>
                                        Resp: &#123;<br/>
                                        &nbsp;&nbsp;"appName": "My Studio",<br/>
                                        &nbsp;&nbsp;"themeColor": "#ff0000",<br/>
                                        &nbsp;&nbsp;"features": &#123; "comic": true, "video": false &#125;<br/>
                                        &#125;
                                    </div>
                                </div>

                                {/* 3. Payment Gateway */}
                                <div className="space-y-1">
                                    <div className="text-white font-bold flex items-center gap-2"><CreditCard size={12}/> 支付系统 (Payment)</div>
                                    <div className="bg-[#111] p-2 rounded font-mono text-gray-300 break-all border-l-2 border-yellow-500">
                                        GET /payment/plans (套餐列表)<br/>
                                        POST /payment/create<br/>
                                        GET /payment/status/:orderId
                                    </div>
                                </div>

                                {/* 4. Proxy Models */}
                                <div className="space-y-1">
                                    <div className="text-white font-bold flex items-center gap-2"><Server size={12}/> 模型代理 (Proxy & RBAC)</div>
                                    <div className="bg-[#111] p-2 rounded font-mono text-gray-300 break-all border-l-2 border-green-500">
                                        GET /models (返回该用户权限下的模型列表)<br/>
                                        POST /proxy/v1/chat/completions
                                    </div>
                                </div>

                            </div>
                        ) : (
                            <div className="text-blue-300/70">
                                点击查看<span className="text-white font-bold">注册登录、支付、裂变、DIY配置</span>的完整后端协议。
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Test Result */}
            {testResult && (
                <div className={`p-3 rounded-lg text-xs font-bold flex items-center gap-2 ${testResult.success ? 'bg-green-900/20 text-green-400 border border-green-900/50' : 'bg-red-900/20 text-red-400 border border-red-900/50'}`}>
                    <Activity size={14} />
                    {testResult.msg}
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex gap-4 mt-auto shrink-0 relative z-10">
             <button 
                onClick={activeTab === 'model' ? handleTestConnection : handleTestBackend}
                disabled={isTesting}
                className="px-6 py-3 rounded-xl border border-[#333] text-white font-bold hover:bg-[#222] transition-colors flex-1"
            >
                {isTesting ? "Testing..." : "测试连接"}
            </button>
            <button 
                onClick={handleSave}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg flex-1"
            >
                保存配置
            </button>
        </div>

        {/* LINKS MODAL (Nested) */}
        {showLinksModal && (
            <div className="absolute inset-0 bg-[#121212] z-50 flex flex-col animate-fade-in">
                <div className="h-16 border-b border-[#262626] flex items-center justify-between px-6 bg-[#171717]">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Link size={18} className="text-cinema-accent"/> API 申请入口
                    </h3>
                    <button onClick={() => setShowLinksModal(false)} className="p-1 rounded-full bg-[#222] text-gray-400 hover:text-white">
                        <X size={18} />
                    </button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    {PROVIDERS.filter(p => p.key !== 'gemini').map(p => (
                        <div key={p.key} className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 flex items-center justify-between group hover:border-cinema-accent transition-colors">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${p.color}`}>
                                    {p.label.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-bold text-white">{p.label}</div>
                                    <div className="text-xs text-gray-500">{p.tip}</div>
                                </div>
                            </div>
                            <a 
                                href={p.url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="px-4 py-2 bg-[#222] text-white text-xs font-bold rounded-lg hover:bg-cinema-accent hover:text-black transition-colors flex items-center gap-2"
                            >
                                注册/申请 <ExternalLink size={12} />
                            </a>
                        </div>
                    ))}
                    <div className="p-4 bg-blue-900/10 border border-blue-500/20 rounded-xl text-xs text-blue-200 leading-relaxed">
                        <strong className="block mb-2 text-blue-100 flex items-center gap-2"><Info size={12}/> 说明</strong>
                        以上 API 平台均为第三方服务，请自行注册获取 API Key。填写到配置中即可使用。
                        <br/>遇到充值或模型问题，请直接联系对应平台的客服。
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default ApiConfigModal;
