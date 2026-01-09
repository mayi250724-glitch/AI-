
import React from 'react';
import { Clapperboard, Image as ImageIcon, Video, Wand2, Heart, ChevronRight, PlayCircle, Settings, User as UserIcon, LogOut, FolderOpen, Zap, X, Play, ArrowRight, Gift, BookOpen, TrendingUp, Layers, PenTool, Layout, Sparkles, Check } from 'lucide-react';

interface HomeViewProps {
  onEnterStudio: () => void;
  onEnterImageGen: () => void;
  onEnterVideoGen: () => void;
  onEnterNovelWorkstation: () => void; 
  onEnterSelfMediaCenter?: () => void;
  onRunDemo: () => void;
  userAvatar?: string;
  userName?: string;
  onOpenAuth: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
}

const HomeView: React.FC<HomeViewProps> = ({ 
  onEnterStudio, 
  onEnterImageGen, 
  onEnterVideoGen,
  onEnterNovelWorkstation,
  onEnterSelfMediaCenter,
  onRunDemo, 
  userAvatar, 
  userName, 
  onOpenAuth, 
  onOpenHistory, 
  onOpenSettings 
}) => {

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden font-geist text-white">
      
      {/* --- HEADER --- */}
      <header className="fixed top-0 left-0 right-0 z-50 animate-fade-in delay-0 backdrop-blur-xl bg-black/20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.location.reload()}>
             <div className="relative">
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="text-white">
                    <path d="M16.2932 11.9774C16.1759 9.03514 18.1298 4.66446 18.1298 4.66446C15.4936 4.64047 12.9105 5.40303 10.718 6.82939L10.7286 6.83318C9.57413 9.97876 9.03203 12.5087 9.30055 16.1502C9.57132 19.8221 12.8069 24.2667 12.8069 24.2667L12.8151 24.289C13.2392 24.0337 13.6347 23.7625 13.9746 23.4789C16.0131 21.7779 18.0004 18.0004 18.0004 18.0004C18.0004 18.0004 16.3906 14.4202 16.2932 11.9774Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M16.4666 9.98601C16.4666 9.98601 21.596 9.33699 26 11.3334C28.1175 12.2933 29.7798 13.6204 30.9149 14.7107L30.92 14.7029C31.6572 17.5844 31.4396 20.7292 30.0845 23.6352C30.0845 23.6352 27.7107 19.586 25.1694 18.401C22.6281 17.2159 18.0004 18.0004 18.0004 18.0004C18.0004 18.0004 16.3905 14.4202 16.2932 11.9773C16.2684 11.3573 16.3357 10.6738 16.4573 9.98113L16.4666 9.98601Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M13.9746 23.4789C11.8918 25.2168 7.71515 26.4899 7.71515 26.4899C8.93912 27.9749 10.5052 29.217 12.3655 30.0844C12.8609 30.3154 13.3632 30.5134 13.8699 30.6791C14.0151 30.6328 14.1603 30.5864 14.3053 30.5399C15.133 30.2741 15.9575 30.0014 16.7635 29.6829C18.3761 29.046 19.9175 28.2253 21.2715 26.9077C22.5979 25.6171 23.8898 23.6366 24.8487 21.9828C25.3286 21.1552 25.7258 20.4079 26.0032 19.8676C26.1418 19.5974 26.2505 19.3789 26.3246 19.2279L26.3599 19.1556C25.9732 18.8502 25.5735 18.5894 25.1695 18.401C22.6281 17.2159 18.0003 18.0003 18.0004 18.0003C18.0004 18.0003 16.0131 21.7778 13.9746 23.4789Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
             </div>
             <span className="text-xl font-display font-semibold tracking-tight">Yesir Studio</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
             <a href="#features" className="px-4 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/5 transition-all">功能特性</a>
             <a href="#gallery" className="px-4 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/5 transition-all">社区作品</a>
             <a href="#pricing" className="px-4 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/5 transition-all">订阅方案</a>
             <button onClick={onOpenSettings} className="px-4 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/5 transition-all">系统设置</button>
          </nav>
          
          <div className="flex items-center gap-2">
             {userName ? (
                 <div className="flex items-center gap-3 pl-1 pr-2 py-1 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer group" onClick={onOpenAuth}>
                     <img src={userAvatar} className="w-8 h-8 rounded-lg object-cover" alt="User" />
                     <span className="text-sm font-medium pr-2 group-hover:text-white text-gray-300">{userName}</span>
                 </div>
             ) : (
                 <>
                    <button onClick={onOpenAuth} className="hidden sm:inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 text-sm font-medium text-white/90 hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-xl">
                        登录
                    </button>
                    <button onClick={onOpenAuth} className="group relative inline-flex h-10 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-black hover:bg-white/90 transition-all shadow-lg shadow-white/20">
                        <span className="relative z-10">开始使用</span>
                        <div className="absolute inset-0 rounded-xl bg-white opacity-0 blur-lg group-hover:opacity-20 transition-opacity"></div>
                    </button>
                 </>
             )}
          </div>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <main>
        <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-32 px-6">
           <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 xl:gap-16">
                  {/* Left Content */}
                  <div className="relative z-10 lg:col-span-6 xl:col-span-5">
                      <div className="animate-slide-up delay-200 mb-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 backdrop-blur-xl">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
                            <span className="text-xs font-medium">AI-Powered Creation</span>
                          </div>
                          <div className="h-4 w-px bg-white/20"></div>
                          <span className="text-xs">Yesir 2.0 Now Available</span>
                      </div>
                      
                      <h1 className="animate-slide-up delay-300 text-5xl md:text-7xl font-light font-geist tracking-tighter mb-6 leading-[0.95]">
                         创造 · <br />
                         <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent">超越想象</span>
                      </h1>
                      
                      <p className="animate-slide-up delay-500 max-w-2xl text-lg md:text-xl text-white/70 leading-relaxed mb-8">
                         利用我们先进的 AI 导演工作室，将您的创意愿景转化为惊艳的现实。从剧本到大银幕，让每一个狂野的想法落地生根。
                      </p>
                      
                      <div className="animate-slide-up delay-700 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                         <button onClick={onEnterStudio} className="group relative inline-flex items-center gap-3 rounded-2xl bg-white px-8 py-4 text-base font-semibold text-black hover:bg-white/90 transition-all shadow-2xl shadow-white/20">
                            <Sparkles className="w-5 h-5 stroke-[1.5]" />
                            <span>开始创作</span>
                            <div className="absolute inset-0 rounded-2xl bg-white opacity-0 blur-xl group-hover:opacity-25 transition-opacity"></div>
                         </button>
                         <button onClick={onRunDemo} className="group inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-base font-medium text-white/90 hover:bg-white/10 hover:border-white/25 transition-all backdrop-blur-xl">
                            <Play className="w-5 h-5 stroke-[1.5]" />
                            <span>观看演示</span>
                         </button>
                      </div>

                      {/* Stats */}
                      <div className="animate-slide-up delay-900 grid grid-cols-3 gap-8 mt-12">
                        <div>
                          <div className="text-2xl text-white font-geist font-light tracking-tighter">2M+</div>
                          <div className="text-sm text-white/60 mt-1">作品生成</div>
                        </div>
                        <div>
                          <div className="text-2xl text-white font-geist font-light tracking-tighter">50k+</div>
                          <div className="text-sm text-white/60 mt-1">创作者</div>
                        </div>
                        <div>
                          <div className="text-2xl text-white font-geist font-light tracking-tighter">99.9%</div>
                          <div className="text-sm text-white/60 mt-1">在线运行</div>
                        </div>
                      </div>
                  </div>

                  {/* Right Visual */}
                  <div className="relative lg:col-span-6 xl:col-span-7">
                      <div className="animate-blur-in delay-500 relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 ring-1 ring-white/5 shadow-2xl shadow-black/40">
                          <img src="https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=1600&auto=format&fit=crop" alt="AI Art" className="h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                          <div className="glow-light"></div>
                          
                          <div className="absolute bottom-4 left-4 right-4">
                              <div className="rounded-xl bg-black/40 p-3 backdrop-blur-xl ring-1 ring-white/10">
                                  <div className="text-sm font-medium text-white">Ethereal Landscape</div>
                                  <div className="text-xs text-white/70 mt-0.5">Generated in 3.2 seconds</div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
           </div>
        </section>

        {/* --- FEATURES SECTION --- */}
        <section id="features" className="relative py-20 lg:py-32">
           <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl mb-6 font-geist font-light tracking-tighter">
                  点亮您的 · <br className="md:hidden" />
                  <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent">创作灵感</span>
                </h2>
                <p className="max-w-2xl mx-auto text-lg text-white/70 leading-relaxed">
                  体验未来式的创意表达，利用 Lumina 的先进 AI 工具，无限放大您的艺术视野。
                </p>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-6 lg:p-8 ring-1 ring-white/5 shadow-2xl shadow-black/40">
                  <div className="grid grid-cols-1 gap-6 lg:gap-8 md:grid-cols-2 lg:grid-cols-3">
                      
                      {/* Feature 1: Studio */}
                      <article className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/8 to-white/4 p-6 backdrop-blur-xl hover:from-white/12 hover:to-white/6 transition-all duration-500 cursor-pointer" onClick={onEnterStudio}>
                          <div className="relative h-48 lg:h-52 overflow-hidden rounded-xl ring-1 ring-white/10 mb-6">
                              <img src="https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?q=80&w=800&auto=format&fit=crop" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                              <div className="absolute top-3 right-3">
                                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20 backdrop-blur-xl">
                                      <Clapperboard size={16} />
                                  </div>
                              </div>
                          </div>
                          <div>
                              <h3 className="text-xl font-display font-semibold tracking-tight mb-3">AI 导演工作室</h3>
                              <p className="text-white/70 leading-relaxed mb-6">专业级分镜脚本创作、一致性控制，以及逐镜头的视频生成能力。</p>
                              <button className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white/90 hover:bg-white/10 hover:border-white/20 transition-all">
                                  进入工作室 <ArrowRight size={14} />
                              </button>
                          </div>
                      </article>

                      {/* Feature 2: Novel */}
                      <article className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/8 to-white/4 p-6 backdrop-blur-xl hover:from-white/12 hover:to-white/6 transition-all duration-500 cursor-pointer" onClick={onEnterNovelWorkstation}>
                          <div className="relative h-48 lg:h-52 overflow-hidden rounded-xl ring-1 ring-white/10 mb-6">
                              <img src="https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=800&auto=format&fit=crop" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                              <div className="absolute top-3 right-3">
                                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20 backdrop-blur-xl">
                                      <BookOpen size={16} />
                                  </div>
                              </div>
                          </div>
                          <div>
                              <h3 className="text-xl font-display font-semibold tracking-tight mb-3">小说创作中心</h3>
                              <p className="text-white/70 leading-relaxed mb-6">拆解爆款网文，智能续写，一键生成漫画脚本。</p>
                              <button className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white/90 hover:bg-white/10 hover:border-white/20 transition-all">
                                  开始写作 <ArrowRight size={14} />
                              </button>
                          </div>
                      </article>

                      {/* Feature 3: Image Gen */}
                      <article className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/8 to-white/4 p-6 backdrop-blur-xl hover:from-white/12 hover:to-white/6 transition-all duration-500 cursor-pointer" onClick={onEnterImageGen}>
                          <div className="relative h-48 lg:h-52 overflow-hidden rounded-xl ring-1 ring-white/10 mb-6">
                              <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                              <div className="absolute top-3 right-3">
                                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20 backdrop-blur-xl">
                                      <ImageIcon size={16} />
                                  </div>
                              </div>
                          </div>
                          <div>
                              <h3 className="text-xl font-display font-semibold tracking-tight mb-3">AI 绘画工坊</h3>
                              <p className="text-white/70 leading-relaxed mb-6">集成 Flux、Midjourney 等顶级模型，支持局部重绘与扩图。</p>
                              <button className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white/90 hover:bg-white/10 hover:border-white/20 transition-all">
                                  生成图片 <ArrowRight size={14} />
                              </button>
                          </div>
                      </article>

                      {/* Feature 4: Video Gen */}
                      <article className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/8 to-white/4 p-6 backdrop-blur-xl hover:from-white/12 hover:to-white/6 transition-all duration-500 cursor-pointer" onClick={onEnterVideoGen}>
                          <div className="relative h-48 lg:h-52 overflow-hidden rounded-xl ring-1 ring-white/10 mb-6">
                              <img src="https://images.unsplash.com/photo-1536240478700-b869070f9279?q=80&w=800&auto=format&fit=crop" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                              <div className="absolute top-3 right-3">
                                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20 backdrop-blur-xl">
                                      <Video size={16} />
                                  </div>
                              </div>
                          </div>
                          <div>
                              <h3 className="text-xl font-display font-semibold tracking-tight mb-3">视频生成实验室</h3>
                              <p className="text-white/70 leading-relaxed mb-6">支持 Sora、Veo、Kling 等模型，提供多模态视频编辑与生成。</p>
                              <button className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white/90 hover:bg-white/10 hover:border-white/20 transition-all">
                                  制作视频 <ArrowRight size={14} />
                              </button>
                          </div>
                      </article>

                      {/* Feature 5: Self Media */}
                      <article className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/8 to-white/4 p-6 backdrop-blur-xl hover:from-white/12 hover:to-white/6 transition-all duration-500 cursor-pointer" onClick={onEnterSelfMediaCenter}>
                          <div className="relative h-48 lg:h-52 overflow-hidden rounded-xl ring-1 ring-white/10 mb-6">
                              <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                              <div className="absolute top-3 right-3">
                                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20 backdrop-blur-xl">
                                      <TrendingUp size={16} />
                                  </div>
                              </div>
                          </div>
                          <div>
                              <h3 className="text-xl font-display font-semibold tracking-tight mb-3">自媒体运营</h3>
                              <p className="text-white/70 leading-relaxed mb-6">全网热榜分析、爆款视频复刻、文案提取与数据追踪。</p>
                              <button className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white/90 hover:bg-white/10 hover:border-white/20 transition-all">
                                  查看数据 <ArrowRight size={14} />
                              </button>
                          </div>
                      </article>

                      {/* Gallery Card */}
                      <article className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#121212] p-6 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-white/5">
                          <div className="mb-4 text-white/30 group-hover:text-white transition-colors">
                              <Heart size={48} />
                          </div>
                          <span className="text-base font-medium text-white/50 group-hover:text-white transition-colors">探索社区佳作</span>
                      </article>

                  </div>
              </div>
           </div>
        </section>

        {/* --- PRICING SECTION --- */}
        <section id="pricing" className="relative lg:py-32 pt-20 pb-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="sm:text-4xl lg:text-5xl text-3xl font-light tracking-tighter font-geist mb-6">
                        选择您的 · 
                        <span className="block bg-clip-text font-light text-transparent tracking-tighter font-geist bg-gradient-to-r from-blue-400 via-purple-400 to-green-400">创作方案</span>
                    </h2>
                    <p className="max-w-2xl mx-auto text-lg text-white/70 leading-relaxed">
                        灵活的定价方案，旨在与您的创意野心共同成长。从免费开始，随心升级。
                    </p>
                </div>

                <div className="flex justify-center">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl">
                        {/* Starter */}
                        <div className="relative hover:bg-white/[0.04] transition-all duration-300 group rounded-2xl p-6 w-[19rem] bg-[#121212] border border-white/10 shadow-inner">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 flex bg-neutral-50/10 border-white/20 border rounded-xl items-center justify-center">
                                        <Zap size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-medium text-white tracking-tight">体验版</h3>
                                        <p className="text-xs text-neutral-500">适合新手入门</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mb-6">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl text-white font-geist font-light tracking-tighter">¥0</span>
                                    <span className="text-sm text-neutral-400">/月</span>
                                </div>
                                <p className="text-xs text-neutral-500 mt-1">无需绑定信用卡</p>
                            </div>
                            <ul className="space-y-3 text-sm text-neutral-300 mb-8">
                                <li className="flex items-start gap-3"><div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center"><Check size={10}/></div> 每日 5 次生成</li>
                                <li className="flex items-start gap-3"><div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center"><Check size={10}/></div> 基础编辑工具</li>
                                <li className="flex items-start gap-3"><div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center"><Check size={10}/></div> 社区支持</li>
                            </ul>
                            <button className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/90 hover:bg-white/10 hover:border-white/20 transition-all" onClick={onOpenAuth}>
                                免费开始
                            </button>
                        </div>

                        {/* Pro */}
                        <div className="relative hover:bg-white/[0.04] transition-all duration-300 group rounded-2xl p-6 w-[19rem] bg-[#121212] border border-white/10 shadow-inner" style={{ backgroundImage: 'radial-gradient(at 88% 40%, rgba(20,20,30,1) 0px, transparent 85%), radial-gradient(at 0% 64%, rgba(124, 58, 237, 0.2) 0px, transparent 85%)' }}>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 flex bg-neutral-50/10 border-white/20 border rounded-xl items-center justify-center">
                                        <Sparkles size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-medium text-white tracking-tight">专业版</h3>
                                        <p className="text-xs text-neutral-500">适合专业创作者</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mb-6">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl text-white font-geist font-light tracking-tighter">¥29</span>
                                    <span className="text-sm text-neutral-400">/月</span>
                                </div>
                                <p className="text-xs text-neutral-500 mt-1">14天免费试用</p>
                            </div>
                            <ul className="space-y-3 text-sm text-neutral-300 mb-8">
                                <li className="flex items-start gap-3"><div className="w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center"><Check size={10}/></div> 无限 AI 生成</li>
                                <li className="flex items-start gap-3"><div className="w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center"><Check size={10}/></div> 高级编辑工具</li>
                                <li className="flex items-start gap-3"><div className="w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center"><Check size={10}/></div> 优先技术支持</li>
                            </ul>
                            <button className="w-full inline-flex gap-2 hover:from-purple-700 hover:to-pink-700 transition-all duration-200 text-sm font-semibold text-white bg-gradient-to-br from-[#4d22b3] to-[#d357fe] rounded-xl py-3 px-6 shadow-lg items-center justify-center" onClick={() => document.getElementById('btn-payment')?.click()}>
                                开始试用
                            </button>
                            <button id="btn-payment" className="hidden" onClick={onOpenSettings} /> 
                        </div>

                        {/* Enterprise */}
                        <div className="relative hover:bg-white/[0.04] transition-all duration-300 group rounded-2xl p-6 w-[19rem] bg-[#121212] border border-white/10 shadow-inner">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 flex bg-neutral-50/10 border-white/20 border rounded-xl items-center justify-center">
                                        <Settings size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-medium text-white tracking-tight">团队版</h3>
                                        <p className="text-xs text-neutral-500">适合大型团队</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mb-6">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl text-white font-geist font-light tracking-tighter">¥99</span>
                                    <span className="text-sm text-neutral-400">/月</span>
                                </div>
                                <p className="text-xs text-neutral-500 mt-1">支持定制化部署</p>
                            </div>
                            <ul className="space-y-3 text-sm text-neutral-300 mb-8">
                                <li className="flex items-start gap-3"><div className="w-4 h-4 bg-orange-600 rounded-full flex items-center justify-center"><Check size={10}/></div> 包含专业版所有功能</li>
                                <li className="flex items-start gap-3"><div className="w-4 h-4 bg-orange-600 rounded-full flex items-center justify-center"><Check size={10}/></div> 无限团队成员</li>
                                <li className="flex items-start gap-3"><div className="w-4 h-4 bg-orange-600 rounded-full flex items-center justify-center"><Check size={10}/></div> 专属客户经理</li>
                            </ul>
                            <button className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/90 hover:bg-white/10 hover:border-white/20 transition-all">
                                联系销售
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- FOOTER --- */}
        <footer className="border-t border-white/10 bg-black/20 backdrop-blur-xl mt-20">
            <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 border border-white/10">
                        <span className="font-bold text-white text-sm">Y</span>
                    </div>
                    <span className="font-semibold text-white/80">Yesir Studio</span>
                </div>
                <div className="text-sm text-white/40">
                    © 2024 Yesir Inc. All rights reserved.
                </div>
                <div className="flex gap-6 text-sm text-white/60">
                    <a href="#" className="hover:text-white transition-colors">隐私协议</a>
                    <a href="#" className="hover:text-white transition-colors">服务条款</a>
                    <a href="#" className="hover:text-white transition-colors">联系我们</a>
                </div>
            </div>
        </footer>

      </main>
    </div>
  );
};

export default HomeView;
