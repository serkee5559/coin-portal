import React, { useState } from 'react';
import { useCryptoWebSocket } from '../hooks/useCryptoWebSocket';
import { Bell, Zap, BellOff, ArrowUpRight, ArrowDownRight, Smartphone, Send, Activity, X, ExternalLink, CheckCircle } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { supabase } from '../supabase';
import { useEffect } from 'react';

const Signals: React.FC = () => {
   const { signals } = useCryptoWebSocket();
   const { theme } = useSettings();
   const [alerts, setAlerts] = useState<any[]>([]);
   const [history, setHistory] = useState<any[]>([]);

   // Supabase에서 데이터 불러오기
   const fetchData = async () => {
      // 알림 리스트 불러오기 (v4: is_active 필드 매핑 확인)
      const { data: alertsData } = await supabase
         .from('alerts')
         .select('*')
         .order('created_at', { ascending: false });

      if (alertsData) {
         // UI에서 사용하는 'active' 속성이 DB의 'is_active'와 일치하도록 매핑
         const mappedData = alertsData.map(a => ({
            ...a,
            active: a.is_active
         }));
         setAlerts(mappedData);
      }

      // 히스토리 불러오기
      const { data: historyData } = await supabase
         .from('alert_history')
         .select('*')
         .order('triggered_at', { ascending: false });

      if (historyData) setHistory(historyData);
   };

   useEffect(() => {
      fetchData();

      // 실시간 알림 이벤트 리스너 등록
      const handleTriggered = (e: any) => {
         const { message } = e.detail;
         showNotification(message, 'info');
         fetchData(); // 데이터 즉시 갱신
      };

      window.addEventListener('crypto_alert_triggered', handleTriggered);

      // 실시간 알림 발생 시 히스토리 동기화를 위해 주기적 새로고침 추가 (10초)
      const interval = setInterval(fetchData, 10000);

      return () => {
         window.removeEventListener('crypto_alert_triggered', handleTriggered);
         clearInterval(interval);
      };
   }, []);

   const [threshold, setThreshold] = useState(5);
   const [newAsset, setNewAsset] = useState('BTC');
   const [newCondition, setNewCondition] = useState('이상');
   const [newPrice, setNewPrice] = useState('');
   const [notification, setNotification] = useState<{ message: string, type: 'success' | 'info' } | null>(null);
   const [pushEnabled, setPushEnabled] = useState(Notification.permission === 'granted');
   const [showTelegramModal, setShowTelegramModal] = useState(false);
   const [telegramConnected, setTelegramConnected] = useState(false);

   const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 3000);

      if (pushEnabled) {
         new Notification('Fast-Coin 알림', {
            body: message,
            icon: '/logo192.png'
         });
      }
   };

   const handlePushToggle = async () => {
      if (!('Notification' in window)) {
         alert('이 브라우저는 알림을 지원하지 않습니다.');
         return;
      }

      if (pushEnabled) {
         setPushEnabled(false);
         setNotification({ message: '웹 푸시 알림이 비활성화되었습니다.', type: 'info' });
         setTimeout(() => setNotification(null), 3000);
         return;
      }

      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
         setPushEnabled(true);
         showNotification('알림 권한이 승인되었습니다.', 'success');
      } else {
         setPushEnabled(false);
         alert('알림 권한이 거부되어 있습니다. 브라우저 설정에서 알림 권한을 허용해주세요.');
      }
   };

   const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.replace(/[^0-9]/g, '');
      if (value) {
         setNewPrice(Number(value).toLocaleString());
      } else {
         setNewPrice('');
      }
   };

   const sendTestNotification = () => {
      if (Notification.permission === 'granted' && pushEnabled) {
         new Notification('Fast-Coin 테스트 알림', {
            body: '웹 푸시 알림이 정상적으로 작동합니다!',
            icon: '/logo192.png'
         });
      } else {
         handlePushToggle();
      }
   };

   const addAlert = () => {
      const rawPrice = newPrice.replace(/,/g, '');
      if (!rawPrice || isNaN(Number(rawPrice))) {
         showNotification('올바른 목표가를 입력해주세요.', 'info');
         return;
      }

      const numericPrice = Number(rawPrice);
      const newAlert = {
         id: `alert-${Date.now()}`,
         asset: newAsset,
         price: numericPrice,
         condition: newCondition,
         active: true,
         channel: '푸시'
      };

      setAlerts(prev => [newAlert, ...prev]);

      // Supabase에 저장
      supabase.from('alerts').insert([{
         asset: newAsset,
         price: numericPrice,
         condition: newCondition,
         channel: '푸시',
         is_active: true
      }]).then();

      setNewPrice('');
      showNotification(`${newAsset} ₩${numericPrice.toLocaleString()} ${newCondition} 알림이 설정되었습니다.`);
   };

   // 알림 삭제 함수 (DB 연동)
   const deleteAlert = async (id: string) => {
      setAlerts(prev => prev.filter(a => a.id !== id));
      await supabase.from('alerts').delete().eq('id', id);
   };

   // 알림 상태 토글 (DB 연동)
   const toggleAlert = async (id: string, currentStatus: boolean) => {
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_active: !currentStatus } : a));
      await supabase.from('alerts').update({ is_active: !currentStatus }).eq('id', id);
   };
   const handleTelegramConnect = () => {
      setTelegramConnected(true);
      setShowTelegramModal(false);
      showNotification('텔레그램 봇이 성공적으로 연결되었습니다.', 'success');
   };

   return (
      <div className="max-w-4xl mx-auto space-y-8">
         <div className={`flex items-center gap-4 p-6 rounded-2xl border transition-colors duration-300 ${theme === 'light' ? 'bg-indigo-50 border-indigo-100' : 'bg-indigo-600/10 border-indigo-500/20'
            }`}>
            <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/30">
               <Zap size={32} className="text-white" />
            </div>
            <div>
               <h2 className={`text-xl font-bold ${theme === 'light' ? 'text-indigo-900' : 'text-white'}`}>스마트 알림 설정</h2>
               <p className={`${theme === 'light' ? 'text-indigo-600/70' : 'text-slate-400'} text-sm`}>시장 급변동 및 기술적 지표 도달 시 실시간으로 알림을 받아보세요.</p>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 신호 설정 카드 */}
            <div className={`border rounded-2xl p-8 shadow-xl transition-colors duration-300 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#161f31] border-[#2d3748]'
               }`}>
               <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  <Bell size={20} className="text-indigo-400" />
                  새 알림 추가
               </h3>
               <div className="space-y-6">
                  <div>
                     <label className={`block text-xs font-bold uppercase mb-2 ${theme === 'light' ? 'text-slate-400' : 'text-slate-500'}`}>대상 자산</label>
                     <select
                        value={newAsset}
                        onChange={(e) => setNewAsset(e.target.value)}
                        className={`w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                           }`}
                     >
                        <option value="BTC">비트코인 (BTC)</option>
                        <option value="ETH">이더리움 (ETH)</option>
                        <option value="SOL">솔라나 (SOL)</option>
                        <option value="XRP">리플 (XRP)</option>
                        <option value="DOGE">도지코인 (DOGE)</option>
                     </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className={`block text-xs font-bold uppercase mb-2 ${theme === 'light' ? 'text-slate-400' : 'text-slate-500'}`}>조건</label>
                        <select
                           value={newCondition}
                           onChange={(e) => setNewCondition(e.target.value)}
                           className={`w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                              }`}
                        >
                           <option value="이상">지정가 이상</option>
                           <option value="이하">지정가 이하</option>
                        </select>
                     </div>
                     <div>
                        <label className={`block text-xs font-bold uppercase mb-2 ${theme === 'light' ? 'text-slate-400' : 'text-slate-500'}`}>목표가 (KRW)</label>
                        <input
                           type="text"
                           value={newPrice}
                           onChange={handlePriceChange}
                           placeholder="95,000,000"
                           className={`w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-mono ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400' : 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-600'
                              }`}
                        />
                     </div>
                  </div>

                  <div>
                     <label className={`block text-xs font-bold uppercase mb-2 ${theme === 'light' ? 'text-slate-400' : 'text-slate-500'}`}>변동성 임계값: {threshold}%</label>
                     <input
                        type="range"
                        min="1"
                        max="20"
                        value={threshold}
                        onChange={(e) => setThreshold(Number(e.target.value))}
                        className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-indigo-500 ${theme === 'light' ? 'bg-slate-100' : 'bg-slate-800'
                           }`}
                     />
                     <div className="flex justify-between mt-2">
                        <span className={`text-[10px] font-bold ${theme === 'light' ? 'text-slate-400' : 'text-slate-600'}`}>안정적</span>
                        <span className={`text-[10px] font-bold ${theme === 'light' ? 'text-slate-400' : 'text-slate-600'}`}>매우 급격함</span>
                     </div>
                  </div>

                  <button
                     onClick={addAlert}
                     className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-bold text-white transition-all shadow-lg shadow-indigo-600/20 mt-4 active:scale-[0.98]"
                  >
                     알림 설정하기
                  </button>
               </div>
            </div>

            {/* 채널 및 내역 */}
            <div className="space-y-6">
               <div className={`border rounded-2xl p-6 shadow-xl transition-colors duration-300 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#161f31] border-[#2d3748]'
                  }`}>
                  <h3 className={`text-sm font-bold uppercase mb-6 tracking-widest ${theme === 'light' ? 'text-slate-500' : 'text-slate-500'}`}>수신 채널 관리</h3>
                  <div className="space-y-4">
                     <div className={`flex items-center justify-between p-4 rounded-xl border ${theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-slate-800/50 border-slate-700/50'
                        }`}>
                        <div className="flex items-center gap-3">
                           <Smartphone className="text-indigo-400" size={18} />
                           <span className={`text-sm font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>웹 푸시 알림</span>
                        </div>
                        <div className="flex items-center gap-3">
                           <button
                              onClick={sendTestNotification}
                              className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 transition-colors"
                           >
                              테스트
                           </button>
                           <div className="relative inline-flex items-center cursor-pointer" onClick={handlePushToggle}>
                              <input type="checkbox" checked={pushEnabled} readOnly className="sr-only peer" />
                              <div className={`w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 ${theme === 'light' ? 'bg-slate-200' : 'bg-slate-700'
                                 }`}></div>
                           </div>
                        </div>
                     </div>
                     <div className={`flex items-center justify-between p-4 rounded-xl border ${theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-slate-800/50 border-slate-700/50'
                        }`}>
                        <div className="flex items-center gap-3">
                           <Send className={`${telegramConnected ? 'text-green-400' : 'text-indigo-400'}`} size={18} />
                           <span className={`text-sm font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>텔레그램 봇</span>
                        </div>
                        {telegramConnected ? (
                           <button
                              onClick={() => setTelegramConnected(false)}
                              className="text-[10px] font-bold text-slate-500 hover:text-red-400 transition-colors"
                           >
                              연결 해제
                           </button>
                        ) : (
                           <button
                              onClick={() => setShowTelegramModal(true)}
                              className="text-[10px] font-bold bg-indigo-600/10 text-indigo-400 px-3 py-1 rounded-lg border border-indigo-500/20"
                           >
                              연결하기
                           </button>
                        )}
                     </div>
                  </div>
               </div>

               <div className={`border rounded-2xl p-6 shadow-xl transition-colors duration-300 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#161f31] border-[#2d3748]'
                  }`}>
                  <h3 className={`text-sm font-bold uppercase mb-6 tracking-widest ${theme === 'light' ? 'text-slate-500' : 'text-slate-500'}`}>활성화된 알림 ({alerts.length})</h3>
                  <div className="space-y-3">
                     {alerts.map(alert => (
                        <div key={alert.id} className={`flex items-center justify-between p-3 rounded-xl transition-colors ${theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-slate-800/30'
                           }`}>
                           <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${alert.condition === '이상' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                 {alert.condition === '이상' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                              </div>
                              <div>
                                 <p className={`text-sm font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{alert.asset} 가격 {alert.condition} ₩{alert.price.toLocaleString()}</p>
                                 <p className="text-[10px] text-slate-500">{alert.channel} 채널 수신 중</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-2">
                              <button
                                 onClick={() => toggleAlert(alert.id, alert.is_active)}
                                 className={`p-2 rounded-lg transition-colors ${alert.is_active ? 'text-indigo-400 bg-indigo-400/10 hover:bg-indigo-400/20' : (theme === 'light' ? 'text-slate-400 bg-slate-100 hover:text-slate-600' : 'text-slate-600 bg-slate-800')}`}
                              >
                                 {alert.is_active ? <Bell size={16} /> : <BellOff size={16} />}
                              </button>
                              <button
                                 onClick={() => deleteAlert(alert.id)}
                                 className={`p-2 rounded-lg transition-colors ${theme === 'light' ? 'text-slate-300 hover:text-red-400 hover:bg-red-50' : 'text-slate-600 hover:text-red-400 hover:bg-red-400/10'}`}
                              >
                                 <X size={16} />
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               <div className={`border rounded-2xl p-6 shadow-xl transition-colors duration-300 ${theme === 'light' ? 'bg-white border-indigo-100 shadow-indigo-100/50' : 'bg-[#161f31] border-indigo-500/30'
                  }`}>
                  <h3 className={`text-sm font-bold uppercase mb-6 tracking-widest flex items-center gap-2 ${theme === 'light' ? 'text-indigo-600' : 'text-indigo-400'
                     }`}>
                     <Activity size={16} />
                     AI 실시간 분석 신호
                  </h3>
                  <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                     {signals.length === 0 ? (
                        <div className="py-10 text-center space-y-3">
                           <div className="flex justify-center">
                              <Activity size={24} className="text-indigo-500/50 animate-pulse" />
                           </div>
                           <p className="text-[11px] text-slate-500 font-medium animate-pulse">
                              실시간 시장 데이터를 분석 중입니다...
                           </p>
                        </div>
                     ) : (
                        signals.map((sig, idx) => (
                           <div key={idx} className={`p-3 rounded-xl border ${theme === 'light' ? 'bg-indigo-50/50 border-indigo-100/50' : 'bg-indigo-600/5 border-indigo-500/10'
                              }`}>
                              <div className="flex justify-between items-start mb-1">
                                 <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${sig.action === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {sig.action}
                                 </span>
                                 <span className="text-[10px] text-slate-500 font-mono">{sig.timestamp}</span>
                              </div>
                              <p className={`text-xs font-bold ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'}`}>{sig.message}</p>
                           </div>
                        ))
                     )}
                  </div>
               </div>

               <div className={`border rounded-2xl p-6 shadow-xl transition-colors duration-300 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#161f31] border-[#2d3748]'
                  }`}>
                  <div className="flex justify-between items-center mb-6">
                     <h3 className={`text-sm font-bold uppercase tracking-widest ${theme === 'light' ? 'text-slate-500' : 'text-slate-500'}`}>최근 알림 설정 히스토리</h3>
                     {history.length > 0 && (
                        <button
                           onClick={() => setHistory([])}
                           className="text-[10px] text-slate-500 hover:text-indigo-400 transition-colors font-bold"
                        >
                           전체 삭제
                        </button>
                     )}
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                     {history.length === 0 ? (
                        <div className="py-12 text-center">
                           <p className="text-xs text-slate-600">설정된 알림 기록이 없습니다.</p>
                        </div>
                     ) : (
                        history.map(item => (
                           <div key={item.id} className={`flex items-center justify-between p-3 rounded-xl border group hover:border-indigo-500/30 transition-all ${theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-slate-800/20 border-slate-700/30'
                              }`}>
                              <div className="flex items-center gap-3">
                                 <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                 <div className="flex flex-col">
                                    <p className={`text-[11px] font-bold ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'}`}>
                                       <span className="text-indigo-400">{item.asset}</span> {item.condition} 알림 발생
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-mono">가격: ₩{item.price.toLocaleString()}</p>
                                 </div>
                              </div>
                              <span className="text-[10px] text-slate-600 font-mono">
                                 {new Date(item.triggered_at).toLocaleTimeString()}
                              </span>
                           </div>
                        ))
                     )}
                  </div>
               </div>
            </div>
         </div>

         {/* 알림 피드백 (Toast) */}
         {notification && (
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[150] animate-in slide-in-from-bottom-5 duration-300">
               <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md border ${notification.type === 'success'
                  ? 'bg-green-500/20 border-green-500/30 text-green-400'
                  : 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400'
                  }`}>
                  <Bell size={18} />
                  <span className="text-sm font-bold">{notification.message}</span>
               </div>
            </div>
         )}
         {/* 텔레그램 연결 모달 */}
         {showTelegramModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
               <div className={`w-full max-w-md rounded-3xl p-8 shadow-2xl relative animate-in zoom-in-95 duration-300 border ${theme === 'light' ? 'bg-white border-slate-100' : 'bg-[#161f31] border-[#2d3748]'
                  }`}>
                  <button
                     onClick={() => setShowTelegramModal(false)}
                     className={`absolute top-6 right-6 transition-colors ${theme === 'light' ? 'text-slate-400 hover:text-slate-900' : 'text-slate-500 hover:text-white'
                        }`}
                  >
                     <X size={20} />
                  </button>

                  <div className="flex flex-col items-center text-center space-y-6">
                     <div className="p-4 bg-indigo-600/20 rounded-2xl">
                        <Send size={40} className="text-indigo-400" />
                     </div>

                     <div className="space-y-2">
                        <h3 className={`text-xl font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>텔레그램 봇 연결</h3>
                        <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>텔레그램에서 실시간 알림을 받아보려면<br />아래 단계를 따라주세요.</p>
                     </div>

                     <div className="w-full space-y-4 text-left">
                        <div className={`flex items-start gap-3 p-4 rounded-2xl border ${theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-slate-800/50 border-slate-700/50'
                           }`}>
                           <div className="bg-indigo-600 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-white">1</div>
                           <div className="space-y-1">
                              <p className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>텔레그램 봇 열기</p>
                              <a
                                 href="https://t.me/example_bot"
                                 target="_blank"
                                 rel="noreferrer"
                                 className="text-[10px] text-indigo-400 flex items-center gap-1 hover:underline"
                              >
                                 @FastCrypto_Alert_Bot <ExternalLink size={10} />
                              </a>
                           </div>
                        </div>

                        <div className={`flex items-start gap-3 p-4 rounded-2xl border ${theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-slate-800/50 border-slate-700/50'
                           }`}>
                           <div className="bg-indigo-600 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-white">2</div>
                           <div className="space-y-1 w-full">
                              <p className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>연결 코드 전송</p>
                              <p className="text-[10px] text-slate-500">봇에게 아래의 코드를 메시지로 보내주세요.</p>
                              <div className={`mt-2 p-3 rounded-xl border flex justify-between items-center group cursor-pointer hover:border-indigo-500/50 transition-colors ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700'
                                 }`}>
                                 <code className="text-lg font-bold text-indigo-400 tracking-wider">FC-77281</code>
                                 <span className="text-[8px] font-bold text-slate-500 group-hover:text-indigo-400 uppercase">Click to copy</span>
                              </div>
                           </div>
                        </div>
                     </div>

                     <button
                        onClick={handleTelegramConnect}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
                     >
                        <CheckCircle size={18} />
                        연결 확인하기
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default Signals;
