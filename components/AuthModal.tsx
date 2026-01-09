
import React, { useState } from 'react';
import { Sparkles, X, User, ArrowRight, CheckCircle, ShieldCheck, Loader2, Key, AlertTriangle, CloudLightning, Share2 } from 'lucide-react';
import * as AuthService from '../services/authService';
import { UserProfile } from '../types';
import * as GeminiService from '../services/geminiService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

type AuthStep = 'login' | 'register' | 'payment' | 'success';

const TARGET_HASH = 'WWVzU2lyNzMzMjU=';

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [step, setStep] = useState<AuthStep>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(''); 
  const [inviteCode, setInviteCode] = useState(''); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  
  const config = GeminiService.getApiConfig();
  const isBackendMode = config.enableBackend;

  if (!isOpen) return null;

  const handleAuthSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (!username.trim() || !password.trim()) {
          setError('请填写所有字段');
          return;
      }

      if (isBackendMode) {
          setIsProcessing(true);
          try {
              if (step === 'register') {
                  const user = await AuthService.registerUser(username, password, inviteCode);
                  onLoginSuccess(user);
              } else {
                  const user = await AuthService.certifyUser(username, password);
                  onLoginSuccess(user);
              }
              onClose();
          } catch (e: any) {
              setError(e.message || "认证失败");
              setIsProcessing(false);
          }
          return;
      }

      try {
          if (btoa(password) !== TARGET_HASH) {
              setError('无效的激活码');
              return;
          }
      } catch (e) {
          setError('激活码格式错误');
          return;
      }

      setStep('payment'); 
  };

  const handlePaymentComplete = () => {
      setIsProcessing(true);
      setTimeout(() => {
          setIsProcessing(false);
          setStep('success');
      }, 2000);
  };

  const handleStartCreating = async () => {
      const user = await AuthService.certifyUser(username);
      onLoginSuccess(user);
      onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in font-geist">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose}></div>
      
      <div className="relative w-full max-w-md bg-[#121212] rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col p-8">
        
        <button onClick={onClose} className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors">
            <X size={20} />
        </button>

        {/* Header */}
        <div className="mb-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_-10px_rgba(255,255,255,0.3)]">
                <Sparkles className="text-white" size={20} />
            </div>
            <h2 className="text-2xl font-light text-white tracking-tight mb-2">
                欢迎来到 <span className="font-semibold">Yesir Studio</span>
            </h2>
            <p className="text-sm text-white/50">请输入您的凭证以继续创作之旅。</p>
        </div>

        {/* Toggle */}
        {isBackendMode && (step === 'login' || step === 'register') && (
            <div className="flex bg-white/5 p-1 rounded-xl mb-6">
                <button 
                    onClick={() => { setStep('login'); setError(''); }} 
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${step === 'login' ? 'bg-white text-black shadow-lg' : 'text-white/60 hover:text-white'}`}
                >
                    登录
                </button>
                <button 
                    onClick={() => { setStep('register'); setError(''); }} 
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${step === 'register' ? 'bg-white text-black shadow-lg' : 'text-white/60 hover:text-white'}`}
                >
                    注册
                </button>
            </div>
        )}

        {/* Forms */}
        {(step === 'login' || step === 'register') && (
            <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-white/60 ml-1">用户名</label>
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" size={16} />
                        <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white text-sm focus:border-white/30 focus:outline-none focus:bg-white/10 transition-all placeholder:text-white/20"
                            placeholder="输入用户名"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-white/60 ml-1">{isBackendMode ? "密码" : "激活码"}</label>
                    <div className="relative group">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" size={16} />
                        <input 
                            type={isBackendMode ? "password" : "text"}
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (error) setError('');
                            }}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white text-sm focus:border-white/30 focus:outline-none focus:bg-white/10 transition-all placeholder:text-white/20"
                            placeholder={isBackendMode ? "••••••••" : "输入激活码"}
                            required
                        />
                    </div>
                </div>

                {step === 'register' && isBackendMode && (
                    <div className="space-y-1.5 animate-slide-up">
                        <label className="text-xs font-medium text-white/60 ml-1">邀请码 (可选)</label>
                        <div className="relative group">
                            <Share2 className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" size={16} />
                            <input 
                                type="text" 
                                value={inviteCode}
                                onChange={(e) => setInviteCode(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white text-sm focus:border-white/30 focus:outline-none focus:bg-white/10 transition-all placeholder:text-white/20"
                                placeholder="如有邀请码请填写"
                            />
                        </div>
                    </div>
                )}

                {error && (
                    <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                        <AlertTriangle size={12} />
                        {error}
                    </div>
                )}

                <button 
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-3.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] mt-4 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {isProcessing ? <Loader2 className="animate-spin" /> : <>{step === 'register' ? "创建账号" : "继续"} <ArrowRight size={16} /></>}
                </button>
            </form>
        )}

        {/* Payment Mock Step */}
        {step === 'payment' && !isBackendMode && (
            <div className="flex flex-col items-center animate-fade-in text-center">
                <div className="bg-white p-2 rounded-xl mb-6 shadow-lg">
                    <img src="https://placehold.co/300x300/white/black?text=QR+PAY" className="w-48 h-48 object-contain mix-blend-multiply" />
                </div>
                <p className="text-sm text-white/60 mb-6">扫码验证设备</p>
                <button 
                    onClick={handlePaymentComplete}
                    disabled={isProcessing}
                    className="w-full py-3.5 rounded-xl bg-green-500 text-black font-bold text-sm hover:bg-green-400 transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] flex items-center justify-center gap-2"
                >
                    {isProcessing ? <Loader2 className="animate-spin" /> : "我已支付"}
                </button>
            </div>
        )}

        {/* Success Step */}
        {step === 'success' && (
            <div className="flex flex-col items-center justify-center text-center py-8 animate-slide-up">
                <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-6 border border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                    <CheckCircle size={32} />
                </div>
                <h3 className="text-2xl font-light text-white mb-2">认证成功</h3>
                <p className="text-white/60 mb-8 max-w-[200px]">欢迎来到 Yesir Studio，开始您的创作之旅。</p>
                <button 
                    onClick={handleStartCreating}
                    className="w-full py-3.5 rounded-xl bg-white text-black font-semibold hover:bg-gray-200 transition-all"
                >
                    进入工作室
                </button>
            </div>
        )}

      </div>
    </div>
  );
};

export default AuthModal;
