
import React, { useEffect, useState } from 'react';
import { X, Check, Star, Zap, Crown, ShieldCheck, Loader2, Sparkles, Settings } from 'lucide-react';
import { PaymentPlan } from '../types';
import * as SystemService from '../services/systemService';
import * as GeminiService from '../services/geminiService';
import { getAuthHeader } from '../services/authService';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const [showQrCode, setShowQrCode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [orderId, setOrderId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'expired'>('pending');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      SystemService.getPaymentPlans().then(data => {
          setPlans(data);
          setLoading(false);
      });
    }
  }, [isOpen]);

  useEffect(() => {
      let interval: any;
      const config = GeminiService.getApiConfig();
      if (showQrCode && orderId && config.enableBackend) {
          interval = setInterval(async () => {
              try {
                  const res = await fetch(`${config.backendUrl}/payment/status/${orderId}`, { headers: getAuthHeader() });
                  const data = await res.json();
                  if (data.status === 'paid') {
                      setPaymentStatus('paid');
                      clearInterval(interval);
                      setTimeout(() => { onSuccess(); onClose(); }, 2000);
                  }
              } catch (e) {}
          }, 3000);
      }
      return () => clearInterval(interval);
  }, [showQrCode, orderId]);

  const handlePurchase = async (planId: string) => {
      setProcessingId(planId);
      const config = GeminiService.getApiConfig();
      if (config.enableBackend) {
          try {
              const res = await fetch(`${config.backendUrl}/payment/create`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                  body: JSON.stringify({ planId, method: 'wechat' })
              });
              if (res.ok) {
                  const data = await res.json();
                  if (data.payUrl) {
                      setQrCodeUrl(data.payUrl);
                      setOrderId(data.orderId);
                      setShowQrCode(true);
                  }
              }
          } catch (e) {}
      } else {
          setTimeout(() => { setProcessingId(null); onSuccess(); onClose(); }, 2000);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-fade-in font-geist">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose}></div>
      
      <div className="relative bg-[#121212] w-full max-w-5xl border border-white/10 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        
        <button onClick={onClose} className="absolute top-6 right-6 text-white/40 hover:text-white z-10 p-2 transition-colors">
            <X size={24} />
        </button>

        {showQrCode ? (
            <div className="flex flex-col items-center justify-center h-full p-20 text-center min-h-[500px]">
                {paymentStatus === 'paid' ? (
                    <div className="flex flex-col items-center animate-fade-in">
                        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                            <Check size={40} className="text-black" />
                        </div>
                        <h2 className="text-3xl font-light text-white">支付成功</h2>
                        <p className="text-white/50 mt-2">正在升级您的账户权益...</p>
                    </div>
                ) : (
                    <>
                        <h2 className="text-3xl font-light text-white mb-8">扫码支付</h2>
                        <div className="bg-white p-3 rounded-2xl mb-6 shadow-2xl">
                            <img 
                                src={qrCodeUrl.startsWith('http') ? qrCodeUrl : `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`} 
                                className="w-56 h-56"
                            />
                        </div>
                        <div className="flex items-center gap-2 text-green-400 text-sm animate-pulse mb-8">
                            <Loader2 size={16} className="animate-spin" /> 等待支付确认...
                        </div>
                        <button onClick={() => setShowQrCode(false)} className="text-sm text-white/40 hover:text-white transition-colors">
                            取消支付
                        </button>
                    </>
                )}
            </div>
        ) : (
            <>
                <div className="text-center p-12 pb-6">
                    <h2 className="text-4xl md:text-5xl font-light text-white mb-4 tracking-tight">
                        解锁 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Pro 级能力</span>
                    </h2>
                    <p className="text-white/50 text-lg max-w-xl mx-auto font-light">
                        加速您的创作流程，解锁更快的渲染速度、独家模型以及无限的创意空间。
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-8 md:p-12">
                    {loading ? (
                        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-white/20" size={32} /></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {plans.map((plan, index) => {
                                // Dynamic Icons based on plan index/type
                                let Icon = Zap;
                                let glowClass = '';
                                if (index === 1) { Icon = Sparkles; glowClass = 'bg-gradient-to-b from-white/10 to-white/5 border-white/20 shadow-[0_0_40px_-10px_rgba(255,255,255,0.1)]'; }
                                if (index === 2) { Icon = Settings; }

                                return (
                                <div 
                                    key={plan.id}
                                    className={`relative rounded-3xl p-8 border transition-all duration-300 hover:-translate-y-1 flex flex-col ${
                                        plan.isPopular 
                                        ? glowClass 
                                        : 'bg-white/5 border-white/5 hover:border-white/10'
                                    }`}
                                    style={plan.isPopular ? { backgroundImage: 'radial-gradient(at 88% 40%, rgba(20,20,30,1) 0px, transparent 85%), radial-gradient(at 0% 64%, rgba(124, 58, 237, 0.2) 0px, transparent 85%)' } : {}}
                                >
                                    {plan.isPopular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                            最受欢迎
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="h-10 w-10 flex bg-neutral-50/10 border-white/20 border rounded-xl items-center justify-center">
                                            <Icon size={20} className="text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-medium text-white tracking-tight">{plan.name}</h3>
                                            <p className="text-xs text-neutral-500">
                                                {index === 0 ? "适合入门" : index === 1 ? "适合专业人士" : "适合团队"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-baseline gap-1 mb-6">
                                        <span className="text-sm text-white/40 font-bold">¥</span>
                                        <span className="text-5xl font-light text-white tracking-tighter">{plan.price}</span>
                                        <span className="text-sm text-white/40 line-through ml-2">¥{plan.originalPrice}</span>
                                    </div>
                                    
                                    <div className="space-y-4 mb-8 flex-1">
                                        {plan.features.map((feat, i) => (
                                            <div key={i} className="flex items-start gap-3 text-sm text-white/70">
                                                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${index === 1 ? 'bg-purple-600' : (index === 2 ? 'bg-orange-600' : 'bg-blue-600')}`}>
                                                    <Check size={10} className="text-white" />
                                                </div>
                                                <span className="leading-tight font-light">{feat}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <button 
                                        onClick={() => handlePurchase(plan.id)}
                                        disabled={!!processingId}
                                        className={`w-full py-4 rounded-xl font-semibold text-sm transition-all ${
                                            plan.isPopular 
                                            ? 'bg-gradient-to-br from-[#4d22b3] to-[#d357fe] hover:from-purple-700 hover:to-pink-700 text-white shadow-lg' 
                                            : 'bg-white/10 text-white hover:bg-white/20'
                                        }`}
                                    >
                                        {processingId === plan.id ? <Loader2 className="animate-spin mx-auto" /> : '选择此方案'}
                                    </button>
                                </div>
                            )})}
                        </div>
                    )}
                </div>
            </>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
