import React, { useState, useEffect } from 'react';
import { useCryptoWebSocket } from '../hooks/useCryptoWebSocket';
import { useSettings } from '../context/SettingsContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Wallet, ShieldCheck, Key, Settings, ExternalLink, ArrowRight, TrendingUp, TrendingDown, X, Check, Globe, LayoutGrid, Moon, Sun, Monitor, Layout, Eye, EyeOff, Save, Download, RefreshCw, PieChart as PieIcon, Activity, AlertTriangle, Clock, Search } from 'lucide-react';
import { supabase } from '../supabase';

interface PortfolioAsset {
   name: string;
   pair: string;
   amount: number;
   buy_price: number;
   color: string;
   current_price: number;
   current_value: number;
   profit_loss: number;
   profit_rate: number;
}

const MyPage: React.FC = () => {
   const { connected } = useCryptoWebSocket(); // To trigger re-renders on price updates if needed, though we'll fetch
   const [portfolio, setPortfolio] = useState<{ total_value: number, assets: PortfolioAsset[] } | null>(null);
   const [showWalletModal, setShowWalletModal] = useState(false);
   const [selectedExchange, setSelectedExchange] = useState<string | null>(null);
   const [isWalletConnected, setIsWalletConnected] = useState(false);
   const [isConnecting, setIsConnecting] = useState(false);
   const [show2FAModal, setShow2FAModal] = useState(false);
   const [is2FAEnabled, setIs2FAEnabled] = useState(false);
   const [faStep, setFaStep] = useState(1); // 1: Info, 2: QR, 3: Verify, 4: Done
   const [showAPIModal, setShowAPIModal] = useState(false);
   const [showThemeModal, setShowThemeModal] = useState(false); // Restored showThemeModal state
   const [showRebalancingModal, setShowRebalancingModal] = useState(false);
   const [rebalancingData, setRebalancingData] = useState<any[]>([]);
   const [connectionStep, setConnectionStep] = useState(1); // 1: Select Type, 2: Select Platform, 3: Input, 4: Loading, 5: Done
   const [walletType, setWalletType] = useState<'api' | 'address'>('api');
   const [apiKeys, setApiKeys] = useState<any[]>([]);

   useEffect(() => {
      const fetchApiKeys = async () => {
         const { data } = await supabase.from('api_keys').select('*');
         if (data) setApiKeys(data);
      };
      fetchApiKeys();
   }, []);
   const {
      theme, setTheme, // Changed activeTheme to theme, setActiveTheme to setTheme
      compactMode, setCompactMode,
      showBalance, setShowBalance
   } = useSettings();

   useEffect(() => {
      const fetchPortfolio = async () => {
         try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const cleanUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
            const response = await fetch(`${cleanUrl}/api/v1/portfolio`);
            const data = await response.json();
            setPortfolio(data);
         } catch (error) {
            console.error('Failed to fetch portfolio:', error);
         }
      };

      fetchPortfolio();
      const interval = setInterval(fetchPortfolio, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
   }, []);

   const handleRebalancing = () => {
      if (!portfolio) return;
      const targets: Record<string, number> = {
         '비트코인': 0.40,
         '이더리움': 0.30,
         '솔라나': 0.20
      };
      const totalValue = portfolio.total_value;
      const suggestions = portfolio.assets.map(asset => {
         const currentWeight = asset.current_value / totalValue;
         const targetWeight = targets[asset.name] || 0.10 / (portfolio.assets.length - 3);
         const targetValue = totalValue * targetWeight;
         const diff = targetValue - asset.current_value;
         return { ...asset, currentWeight, targetWeight, diff, action: diff > 0 ? 'BUY' : 'SELL' };
      });
      setRebalancingData(suggestions);
      setShowRebalancingModal(true);
   };

   const handleConnect = async () => {
      setConnectionStep(4);
      setTimeout(async () => {
         const newKey = {
            exchange: selectedExchange,
            name: `${selectedExchange} 연결`,
            key_masked: '••••••••••••••••' + Math.random().toString(16).slice(-4),
            status: 'active'
         };
         const { data } = await supabase.from('api_keys').insert([newKey]).select();
         if (data) setApiKeys(prev => [...prev, ...data]);
         setConnectionStep(5);
         setIsWalletConnected(true);
      }, 2000);
   };

   const closeWalletModal = () => {
      setShowWalletModal(false);
      setConnectionStep(1);
   };

   const totalValue = portfolio?.total_value || 0;

   return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* 포트폴리오 분석 섹션 */}
         <div className="lg:col-span-2 space-y-6">
            <div className={`border rounded-2xl p-8 shadow-xl transition-colors duration-300 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#161f31] border-[#2d3748]'
               }`}>
               <div className="flex justify-between items-center mb-8">
                  <div>
                     <h3 className="text-xl font-bold mb-1">포트폴리오 분석</h3>
                     <p className="text-sm text-slate-400 font-medium">내 자산의 전반적인 배분 현황</p>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">총 평가 금액</p>
                     <p className="text-3xl font-bold font-mono tracking-tight">
                        {showBalance ? `₩${totalValue.toLocaleString()}` : '₩ ••••••••'}
                     </p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="h-64 relative">
                     {portfolio ? (
                        <ResponsiveContainer width="100%" height="100%" className="animate-in fade-in duration-500">
                           <PieChart>
                              <Pie
                                 data={portfolio.assets}
                                 innerRadius={60}
                                 outerRadius={90}
                                 paddingAngle={8}
                                 dataKey="current_value"
                                 stroke="none"
                                 isAnimationActive={true}
                                 animationBegin={0}
                                 animationDuration={500}
                                 animationEasing="ease-out"
                              >
                                 {portfolio.assets.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                 ))}
                              </Pie>
                              <Tooltip
                                 contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                 formatter={(value: number) => `₩${value.toLocaleString()}`}
                              />
                           </PieChart>
                        </ResponsiveContainer>
                     ) : (
                        <div className="w-full h-full flex items-center justify-center">
                           <div className="w-12 h-12 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
                        </div>
                     )}
                     {portfolio && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                           <p className="text-xs font-bold text-slate-500">보유 자산</p>
                           <p className="text-xl font-bold">{portfolio?.assets.length || 0}종</p>
                        </div>
                     )}
                  </div>

                  <div className="space-y-4">
                     {portfolio?.assets.map((item) => (
                        <div key={item.name} className="flex items-center justify-between group">
                           <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                              <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{item.name}</span>
                           </div>
                           <div className="text-right">
                              <p className="text-sm font-bold font-mono">
                                 {showBalance ? `₩${item.current_value.toLocaleString()}` : '₩ ••••'}
                              </p>
                              <p className="text-[10px] text-slate-500 font-bold">{totalValue > 0 ? ((item.current_value / totalValue) * 100).toFixed(1) : 0}%</p>
                           </div>
                        </div>
                     ))}
                     <button
                        onClick={handleRebalancing}
                        className="w-full mt-4 flex items-center justify-center gap-2 text-indigo-400 text-sm font-bold hover:text-indigo-300 transition-colors"
                     >
                        포트폴리오 리밸런싱 제안 <ArrowRight size={16} />
                     </button>
                  </div>
               </div>
            </div>

            {/* 보유 자산 목록 */}
            <div className={`border rounded-2xl overflow-hidden shadow-xl transition-colors duration-300 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#161f31] border-[#2d3748]'
               }`}>
               <div className={`p-6 border-b flex justify-between items-center ${theme === 'light' ? 'border-slate-100' : 'border-slate-700/50'}`}>
                  <h3 className={`font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>보유 자산 상세</h3>
                  <button className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${theme === 'light' ? 'bg-slate-100 text-slate-600 hover:text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-white'
                     }`}>CSV 내보내기</button>
               </div>
               <div className="p-6 space-y-4">
                  {portfolio?.assets.map((item) => (
                     <div key={item.pair} className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${theme === 'light' ? 'bg-slate-50 border-slate-100 hover:border-indigo-500/30' : 'bg-slate-800/30 border-slate-700/50 hover:border-indigo-500/30'
                        }`}>
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-bold uppercase">{item.pair.split('-')[1].charAt(0)}</div>
                           <div>
                              <p className={`text-sm font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{item.name} 보유분</p>
                              <p className="text-[10px] text-slate-500">{item.amount} {item.pair.split('-')[1]}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className={`text-sm font-bold font-mono ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                              {showBalance ? `₩${item.current_value.toLocaleString()}` : '₩ ••••'}
                           </p>
                           <div className={`flex items-center justify-end gap-1 text-[10px] font-bold ${item.profit_loss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {item.profit_loss >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                              평가 수익 {showBalance ? `${item.profit_rate.toFixed(2)}%` : '••%'}
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>

         {/* 사이드바 / 설정 섹션 */}
         <div className="space-y-6">
            <div className={`rounded-2xl p-6 shadow-xl relative overflow-hidden group transition-all duration-500 ${isWalletConnected ? 'bg-gradient-to-br from-green-600 to-green-800 shadow-green-600/20' : 'bg-gradient-to-br from-indigo-600 to-indigo-800 shadow-indigo-600/20'}`}>
               <div className="absolute -bottom-4 -right-4 opacity-10 group-hover:scale-110 transition-transform text-white">
                  <Wallet size={120} />
               </div>
               <h4 className="text-lg font-bold mb-4 text-white">
                  {isWalletConnected ? '거래소 연결 완료' : '거래소 지갑 연결'}
               </h4>
               <p className="text-indigo-100 text-xs mb-6 leading-relaxed">
                  {isWalletConnected
                     ? '업비트 계정과 성공적으로 연동되었습니다. 실시간 자산 데이터가 동기화 중입니다.'
                     : 'API 키 또는 지갑 주소를 연결하여 실시간 잔고를 안전하게 동기화하세요.'}
               </p>
               {isWalletConnected ? (
                  <div className="flex items-center gap-2 text-white bg-white/20 w-fit px-3 py-1.5 rounded-lg border border-white/30 backdrop-blur-sm">
                     <Check size={14} className="text-green-300" />
                     <span className="text-xs font-bold">동기화 활성</span>
                  </div>
               ) : (
                  <button
                     onClick={() => setShowWalletModal(true)}
                     className="bg-white text-indigo-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors flex items-center gap-2"
                  >
                     새 연결 추가 <ExternalLink size={14} />
                  </button>
               )}
            </div>

            <div className={`border rounded-2xl p-6 shadow-xl transition-colors duration-300 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#161f31] border-[#2d3748]'
               }`}>
               <h4 className={`text-sm font-bold uppercase mb-6 tracking-widest ${theme === 'light' ? 'text-slate-500' : 'text-slate-500'}`}>보안 및 개인 설정</h4>
               <div className="space-y-4">
                  <button
                     onClick={() => setShow2FAModal(true)}
                     className={`w-full flex items-center justify-between p-3 rounded-xl transition-all group ${theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-slate-800'
                        }`}
                  >
                     <div className="flex items-center gap-3">
                        <ShieldCheck size={20} className="text-indigo-400" />
                        <span className={`text-sm font-medium ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'}`}>2단계 인증 (2FA)</span>
                     </div>
                     {is2FAEnabled ? (
                        <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded">보안 유지 중</span>
                     ) : (
                        <span className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${theme === 'light' ? 'text-slate-400 bg-slate-100 group-hover:text-indigo-600' : 'text-slate-500 bg-slate-800 group-hover:text-indigo-400'
                           }`}>설정 필요</span>
                     )}
                  </button>
                  <button
                     onClick={() => setShowAPIModal(true)}
                     className={`w-full flex items-center justify-between p-3 rounded-xl transition-all group ${theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-slate-800'
                        }`}
                  >
                     <div className="flex items-center gap-3">
                        <Key size={20} className="text-indigo-400" />
                        <span className={`text-sm font-medium ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'}`}>API 키 관리</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded ${theme === 'light' ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-500'
                           }`}>{apiKeys.length}개 활성</span>
                        <ArrowRight size={16} className="text-slate-600 group-hover:text-indigo-400" />
                     </div>
                  </button>
                  <button
                     onClick={() => setShowThemeModal(true)}
                     className={`w-full flex items-center justify-between p-3 rounded-xl transition-all group ${theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-slate-800'
                        }`}
                  >
                     <div className="flex items-center gap-3">
                        <Settings size={20} className="text-indigo-400" />
                        <span className={`text-sm font-medium ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'}`}>테마 및 디스플레이</span>
                     </div>
                     <span className={`text-[10px] font-bold uppercase ${theme === 'light' ? 'text-slate-400' : 'text-slate-500'}`}>
                        {theme === 'dark' ? '다크 모드' : theme === 'light' ? '라이트 모드' : '시스템 설정'}
                     </span>
                  </button>
               </div>
            </div>

            <div className={`p-6 rounded-2xl border transition-colors ${theme === 'light' ? 'bg-slate-50 border-slate-200/60' : 'bg-slate-800/20 border-slate-700/30'
               }`}>
               <p className="text-[10px] text-slate-500 text-center leading-relaxed font-mono">
                  Fast-Crypto Insight v2.4.0 <br />
                  © 2024 Insight FinTech. All rights reserved.
               </p>
            </div>
         </div>

         {/* 2FA 설정 모달 */}
         {show2FAModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
               <div className={`w-full max-w-sm rounded-[3rem] p-10 relative animate-in zoom-in-95 duration-300 ${theme === 'light' ? 'bg-white border-slate-200 shadow-xl' : 'bg-[#161f31] border-[#2d3748] shadow-3xl'
                  }`}>
                  <button
                     onClick={() => { setShow2FAModal(false); setFaStep(1); }}
                     className={`absolute top-8 right-8 transition-colors ${theme === 'light' ? 'text-slate-400 hover:text-slate-700' : 'text-slate-500 hover:text-white'
                        }`}
                  >
                     <X size={20} />
                  </button>

                  <div className="text-center space-y-6">
                     <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-2 text-indigo-400 ${theme === 'light' ? 'bg-indigo-100 border border-indigo-200' : 'bg-indigo-600/20 border border-indigo-500/20'
                        }`}>
                        <ShieldCheck size={40} />
                     </div>

                     {faStep === 1 && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                           <div className="space-y-2">
                              <h3 className="text-2xl font-black">2단계 인증 설정</h3>
                              <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>계정 보안을 강화하기 위해 Google OTP 또는 Authy를 연결하세요.</p>
                           </div>
                           <div className="space-y-3">
                              <div className={`flex items-center gap-4 p-4 rounded-2xl border text-left ${theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-white/5 border-white/10'
                                 }`}>
                                 <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">1</div>
                                 <p className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>인증 앱(Google OTP 등)을 설치합니다.</p>
                              </div>
                              <div className={`flex items-center gap-4 p-4 rounded-2xl border text-left ${theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-white/5 border-white/10'
                                 }`}>
                                 <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">2</div>
                                 <p className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>제공된 QR 코드를 스캔합니다.</p>
                              </div>
                           </div>
                           <button
                              onClick={() => setFaStep(2)}
                              className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20"
                           >
                              시작하기
                           </button>
                        </div>
                     )}

                     {faStep === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 text-center">
                           <div className="space-y-2">
                              <h3 className="text-xl font-bold">QR 코드 스캔</h3>
                              <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>인증 앱에서 아래 코드를 스캔하세요.</p>
                           </div>
                           <div className="w-48 h-48 bg-white p-4 rounded-3xl mx-auto flex items-center justify-center shadow-2xl">
                              <div className="w-full h-full bg-slate-900 rounded-xl overflow-hidden relative flex items-center justify-center">
                                 <Globe className="text-white/20" size={60} />
                                 <div className="absolute inset-2 border-2 border-white/10 border-dashed rounded-lg" />
                                 <span className="absolute bottom-4 text-[8px] font-mono text-white/40 uppercase tracking-widest">Digital Auth QR</span>
                                 {/* This is a visual representation of a QR code */}
                                 <div className="grid grid-cols-4 gap-1 p-2">
                                    {[...Array(16)].map((_, i) => (
                                       <div key={i} className={`w-3 h-3 rounded-sm ${Math.random() > 0.5 ? 'bg-indigo-400' : 'bg-white'}`} />
                                    ))}
                                 </div>
                              </div>
                           </div>
                           <div className={`p-3 rounded-xl border font-mono text-xs cursor-copy active:scale-95 transition-transform ${theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-800/50 border-slate-700/50 text-slate-300'
                              }`} title="복사">
                              SECRET-KEY-FAST-CRYPTO-2024
                           </div>
                           <button
                              onClick={() => setFaStep(3)}
                              className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-bold transition-all"
                           >
                              스캔 완료
                           </button>
                        </div>
                     )}

                     {faStep === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                           <div className="space-y-2">
                              <h3 className="text-xl font-bold">인증 코드 확인</h3>
                              <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>인증 앱에 표시된 6자리 코드를 입력하세요.</p>
                           </div>
                           <div className="flex gap-2 justify-center">
                              {[...Array(6)].map((_, i) => (
                                 <input
                                    key={i}
                                    type="text"
                                    maxLength={1}
                                    className={`w-10 h-14 rounded-xl text-center text-xl font-bold font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                                       }`}
                                    placeholder="0"
                                    autoFocus={i === 0}
                                 />
                              ))}
                           </div>
                           <button
                              onClick={() => {
                                 setIs2FAEnabled(true);
                                 setFaStep(4);
                              }}
                              className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20"
                           >
                              인증 및 활성화
                           </button>
                        </div>
                     )}

                     {faStep === 4 && (
                        <div className="space-y-6 animate-in zoom-in-95 duration-500">
                           <div className="relative">
                              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/20">
                                 <Check size={32} className="text-white" />
                              </div>
                              <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
                           </div>
                           <div className="space-y-2">
                              <h3 className="text-2xl font-black">설정 완료!</h3>
                              <p className={`text-sm leading-relaxed ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                                 이제 로그인을 하거나 자산을 출금할 때 <br />
                                 2단계 인증이 필요합니다.
                              </p>
                           </div>
                           <button
                              onClick={() => {
                                 setShow2FAModal(false);
                                 setFaStep(1);
                              }}
                              className={`w-full py-4 rounded-2xl font-bold transition-all ${theme === 'light' ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700'
                                 }`}
                           >
                              대시보드로 돌아가기
                           </button>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         )}
         {/* API 키 관리 모달 */}
         {showAPIModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
               <div className={`w-full max-w-lg rounded-[2.5rem] p-10 relative animate-in zoom-in-95 duration-300 ${theme === 'light' ? 'bg-white border-slate-200 shadow-xl' : 'bg-[#161f31] border-[#2d3748] shadow-3xl'
                  }`}>
                  <button
                     onClick={() => setShowAPIModal(false)}
                     className={`absolute top-8 right-8 transition-colors p-2 rounded-full ${theme === 'light' ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-700' : 'text-slate-500 hover:bg-slate-800 hover:text-white'
                        }`}
                  >
                     <X size={24} />
                  </button>

                  <div className="space-y-8">
                     <div className="space-y-2">
                        <h3 className="text-2xl font-black tracking-tight">API 키 관리</h3>
                        <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>연결된 외부 거래소의 API 키 목록입니다.</p>
                     </div>

                     <div className="space-y-4">
                        {apiKeys.length > 0 ? apiKeys.map((key) => (
                           <div key={key.id} className={`p-5 rounded-3xl border transition-all group ${theme === 'light' ? 'bg-slate-50 border-slate-100 hover:border-indigo-500/30' : 'bg-slate-800/40 border-slate-700/50 hover:border-indigo-500/30'
                              }`}>
                              <div className="flex justify-between items-start mb-4">
                                 <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-400 font-bold">
                                       {key.exchange.charAt(0)}
                                    </div>
                                    <div>
                                       <h4 className={`font-bold text-sm ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{key.name}</h4>
                                       <p className="text-[10px] text-slate-500 uppercase tracking-widest">{key.exchange} • {key.status}</p>
                                    </div>
                                 </div>
                                 <button
                                    onClick={() => setApiKeys(prev => prev.filter(k => k.id !== key.id))}
                                    className="text-[10px] font-bold text-red-500/50 hover:text-red-500 transition-colors"
                                 >
                                    삭제
                                 </button>
                              </div>
                              <div className={`flex items-center justify-between p-3 rounded-xl border ${theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/50 border-slate-700/30'
                                 }`}>
                                 <code className={`text-[10px] font-mono ${theme === 'light' ? 'text-slate-700' : 'text-slate-400'}`}>{key.key}</code>
                                 <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded">읽기 전용</span>
                              </div>
                           </div>
                        )) : (
                           <div className={`py-12 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center ${theme === 'light' ? 'border-slate-300 text-slate-400' : 'border-slate-700/50 text-slate-500'
                              }`}>
                              <Key size={32} className="mb-4 opacity-20" />
                              <p className="text-xs">활성화된 API 키가 없습니다.</p>
                           </div>
                        )}
                     </div>

                     <button
                        onClick={() => { setShowAPIModal(false); setShowWalletModal(true); }}
                        className={`w-full py-4 rounded-2xl font-bold transition-all border text-sm ${theme === 'light' ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700/50 text-slate-300'
                           }`}
                     >
                        + 새 API 키 추가하기
                     </button>
                  </div>
               </div>
            </div>
         )}
         {/* 테마 및 디스플레이 모달 */}
         {showThemeModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
               <div className={`w-full max-w-md rounded-[2.5rem] p-10 relative animate-in zoom-in-95 duration-300 ${theme === 'light' ? 'bg-white border-slate-200 shadow-xl' : 'bg-[#161f31] border-[#2d3748] shadow-3xl'
                  }`}>
                  <button
                     onClick={() => setShowThemeModal(false)}
                     className={`absolute top-8 right-8 transition-colors p-2 rounded-full ${theme === 'light' ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-700' : 'text-slate-500 hover:bg-slate-800 hover:text-white'
                        }`}
                  >
                     <X size={24} />
                  </button>

                  <div className="space-y-8">
                     <div className="space-y-2">
                        <h3 className="text-2xl font-black tracking-tight">테마 및 디스플레이</h3>
                        <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>사용자 환경에 맞는 스타일을 선택하세요.</p>
                     </div>

                     <div className="space-y-6">
                        <div className="space-y-3">
                           <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">컬러 테마</label>
                           <div className="grid grid-cols-3 gap-3">
                              {[
                                 { id: 'dark', name: 'Dark', icon: <Moon size={16} /> },
                                 { id: 'light', name: 'Light', icon: <Sun size={16} /> },
                                 { id: 'system', name: 'Auto', icon: <Monitor size={16} /> }
                              ].map(t => ( // Changed theme to t to avoid conflict with context theme
                                 <button
                                    key={t.id}
                                    onClick={() => setTheme(t.id as 'dark' | 'light' | 'system')} // Fixed theme type issue
                                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${theme === t.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' : (theme === 'light' ? 'bg-slate-50 border-slate-100 text-slate-600 hover:border-slate-200' : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:border-slate-600')}`}
                                 >
                                    {t.icon}
                                    <span className="text-[10px] font-bold">{t.name}</span>
                                 </button>
                              ))}
                           </div>
                        </div>

                        <div className="space-y-3">
                           <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">상세 설정</label>
                           <div className="space-y-2">
                              <div
                                 onClick={() => setCompactMode(!compactMode)}
                                 className={`flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all ${theme === 'light' ? 'bg-slate-50 border-slate-100 hover:bg-slate-100' : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60'
                                    }`}
                              >
                                 <div className="flex items-center gap-3">
                                    <Layout size={18} className="text-indigo-400" />
                                    <span className={`text-sm font-medium ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'}`}>컴팩트 모드</span>
                                 </div>
                                 <div className={`w-10 h-5 rounded-full relative transition-colors ${compactMode ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${compactMode ? 'left-6' : 'left-1'}`} />
                                 </div>
                              </div>

                              <div
                                 onClick={() => setShowBalance(!showBalance)}
                                 className={`flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all ${theme === 'light' ? 'bg-slate-50 border-slate-100 hover:bg-slate-100' : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60'
                                    }`}
                              >
                                 <div className="flex items-center gap-3">
                                    {showBalance ? <Eye size={18} className="text-indigo-400" /> : <EyeOff size={18} className="text-slate-500" />}
                                    <span className={`text-sm font-medium ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'}`}>자산 금액 숨기기</span>
                                 </div>
                                 <div className={`w-10 h-5 rounded-full relative transition-colors ${!showBalance ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${!showBalance ? 'left-6' : 'left-1'}`} />
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>

                     <button
                        onClick={() => setShowThemeModal(false)}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20"
                     >
                        설정 저장하기
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* 거래소/지갑 연결 모달 */}
         {showWalletModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
               <div className={`w-full max-w-md rounded-[2.5rem] p-10 relative animate-in zoom-in-95 duration-300 ${theme === 'light' ? 'bg-white border-slate-200 shadow-xl' : 'bg-[#161f31] border-[#2d3748] shadow-3xl'
                  }`}>
                  <button
                     onClick={closeWalletModal}
                     className={`absolute top-8 right-8 transition-colors p-2 rounded-full ${theme === 'light' ? 'text-slate-400 hover:bg-slate-100' : 'text-slate-500 hover:bg-slate-800'
                        }`}
                  >
                     <X size={24} />
                  </button>

                  <div className="space-y-6">
                     {connectionStep === 1 && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                           <div className="text-center space-y-2">
                              <div className="w-16 h-16 bg-indigo-600/10 rounded-2xl flex items-center justify-center mx-auto text-indigo-500 mb-4">
                                 <Wallet size={32} />
                              </div>
                              <h3 className="text-2xl font-black">자산 연결 선택</h3>
                              <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>어떤 방식으로 자산을 가져올까요?</p>
                           </div>
                           <div className="grid grid-cols-1 gap-3">
                              <button
                                 onClick={() => { setWalletType('api'); setConnectionStep(2); }}
                                 className={`p-5 rounded-2xl border text-left transition-all hover:border-indigo-500/50 group ${theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-slate-800/40 border-slate-700/50'
                                    }`}
                              >
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                                       <Key size={20} />
                                    </div>
                                    <div>
                                       <h4 className="font-bold text-sm">거래소 API 연결</h4>
                                       <p className="text-[10px] text-slate-500">업비트, 빗썸, 바이낸스 등</p>
                                    </div>
                                 </div>
                              </button>
                              <button
                                 onClick={() => { setWalletType('address'); setConnectionStep(2); }}
                                 className={`p-5 rounded-2xl border text-left transition-all hover:border-indigo-500/50 group ${theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-slate-800/40 border-slate-700/50'
                                    }`}
                              >
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white">
                                       <Globe size={20} />
                                    </div>
                                    <div>
                                       <h4 className="font-bold text-sm">온체인 지갑 주소</h4>
                                       <p className="text-[10px] text-slate-500">이더리움, 솔라나 지갑 등</p>
                                    </div>
                                 </div>
                              </button>
                           </div>
                        </div>
                     )}

                     {connectionStep === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                           <h3 className="text-xl font-bold">플랫폼 선택</h3>
                           <div className="grid grid-cols-2 gap-3">
                              {(walletType === 'api' ? ['Upbit', 'Bithumb', 'Binance', 'Bybit'] : ['Ethereum', 'Solana', 'Metamask', 'Phantom']).map(name => (
                                 <button
                                    key={name}
                                    onClick={() => { setSelectedExchange(name); setConnectionStep(3); }}
                                    className={`p-4 rounded-2xl border transition-all hover:border-indigo-500 font-bold text-sm ${selectedExchange === name ? 'border-indigo-600 bg-indigo-600/10 text-indigo-400' : (theme === 'light' ? 'bg-slate-50 border-slate-100 text-slate-600' : 'bg-slate-800/40 border-slate-700/50 text-slate-400')
                                       }`}
                                 >
                                    {name}
                                 </button>
                              ))}
                           </div>
                           <button onClick={() => setConnectionStep(1)} className="text-xs text-slate-500 font-bold hover:text-indigo-400 transition-colors w-full text-center">뒤로 가기</button>
                        </div>
                     )}

                     {connectionStep === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                           <div className="space-y-2">
                              <h3 className="text-xl font-bold">{selectedExchange} 연결 정보</h3>
                              <p className="text-xs text-slate-400">{walletType === 'api' ? 'API Key와 Secret Key를 입력하세요.' : '지갑 주소를 입력하세요.'}</p>
                           </div>
                           <div className="space-y-4">
                              {walletType === 'api' ? (
                                 <>
                                    <input type="text" placeholder="Access Key" className={`w-full p-4 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500/50 ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'}`} />
                                    <input type="password" placeholder="Secret Key" className={`w-full p-4 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500/50 ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'}`} />
                                 </>
                              ) : (
                                 <input type="text" placeholder="0x... 또는 지갑 주소" className={`w-full p-4 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500/50 ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'}`} />
                              )}
                           </div>
                           <button onClick={handleConnect} className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-bold text-white transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]">연결하기</button>
                           <button onClick={() => setConnectionStep(2)} className="text-xs text-slate-500 font-bold hover:text-indigo-400 transition-colors w-full text-center">뒤로 가기</button>
                        </div>
                     )}

                     {connectionStep === 4 && (
                        <div className="py-20 flex flex-col items-center justify-center space-y-6 animate-in zoom-in-95 duration-300">
                           <div className="w-16 h-16 border-4 border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin" />
                           <p className="font-bold text-indigo-400 animate-pulse">{selectedExchange} 보안 연결을 생성 중...</p>
                        </div>
                     )}

                     {connectionStep === 5 && (
                        <div className="py-10 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-500">
                           <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mb-2">
                              <Check size={40} />
                           </div>
                           <div className="space-y-2">
                              <h3 className="text-2xl font-black">연결 완료!</h3>
                              <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>{selectedExchange} 계정이 성공적으로 연결되었습니다.</p>
                           </div>
                           <button onClick={closeWalletModal} className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-bold text-white transition-all">확인</button>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         )}

         {/* 리밸런싱 모달 */}
         {showRebalancingModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
               <div className={`w-full max-w-2xl rounded-[2.5rem] p-10 relative animate-in zoom-in-95 duration-300 ${theme === 'light' ? 'bg-white border-slate-200 shadow-xl' : 'bg-[#161f31] border-[#2d3748] shadow-3xl'
                  }`}>
                  <button onClick={() => setShowRebalancingModal(false)} className={`absolute top-8 right-8 p-2 rounded-full transition-colors ${theme === 'light' ? 'text-slate-400 hover:bg-slate-100' : 'text-slate-500 hover:bg-slate-800'}`}>
                     <X size={24} />
                  </button>
                  <div className="space-y-8">
                     <div className="space-y-2">
                        <h3 className="text-2xl font-black tracking-tight">포트폴리오 리밸런싱 제안</h3>
                        <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>현재 보유 자산을 목표 비중으로 조정하기 위한 제안입니다.</p>
                     </div>
                     <div className="space-y-3">
                        {rebalancingData.map((item, idx) => (
                           <div key={idx} className={`p-4 rounded-2xl border flex items-center justify-between ${theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-slate-800/40 border-slate-700/50'}`}>
                              <div className="flex items-center gap-4">
                                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${item.action === 'BUY' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{item.action}</div>
                                 <div>
                                    <p className="text-sm font-bold">{item.name}</p>
                                    <p className="text-[10px] text-slate-500">현재 {(item.currentWeight * 100).toFixed(1)}% → 목표 {(item.targetWeight * 100).toFixed(1)}%</p>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className={`text-sm font-bold font-mono ${item.diff > 0 ? 'text-green-400' : 'text-red-400'}`}>₩{Math.abs(item.diff).toLocaleString()}</p>
                                 <p className="text-[10px] text-slate-500">{item.action === 'BUY' ? '추가 매수' : '일부 매도'}</p>
                              </div>
                           </div>
                        ))}
                     </div>
                     <button onClick={() => setShowRebalancingModal(false)} className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-bold text-white transition-all shadow-lg shadow-indigo-600/20">제안 확인 완료</button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default MyPage;
