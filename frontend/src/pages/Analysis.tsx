
import React, { useState, useEffect, useRef } from 'react';
import { MOCK_WHALE_MOVEMENTS } from '../services/mockData';
import { ComposedChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Rectangle, Area, CartesianGrid } from 'recharts';
import { Terminal, Shield, Zap, Search, Activity, Cpu, X, TrendingUp } from 'lucide-react';
import PriceUpdateLabel from '../components/PriceUpdateLabel';
import { useCryptoWebSocket } from '../hooks/useCryptoWebSocket';
import { useSettings } from '../context/SettingsContext';

const Analysis: React.FC = () => {
  const { coins } = useCryptoWebSocket();
  const { theme } = useSettings();
  const btcData = coins.find(c => c.symbol === 'BTC');
  const [indicators, setIndicators] = useState<{ rsi: number, ma7: number, ma20: number } | null>(null);
  const [candles, setCandles] = useState<any[]>([]);
  const [logs, setLogs] = useState(MOCK_WHALE_MOVEMENTS);
  const [interval, setIntervalState] = useState('60');
  const [showSettings, setShowSettings] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [visibleIndicators, setVisibleIndicators] = useState({
    ma7: true,
    ma20: true,
    rsi: true
  });
  const terminalRef = useRef<HTMLDivElement>(null);

  const INTERVALS = [
    { label: '1분', value: '1' },
    { label: '5분', value: '5' },
    { label: '15분', value: '15' },
    { label: '1시간', value: '60' },
    { label: '4시간', value: '240' },
    { label: '일봉', value: 'days' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const cleanUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        // Fetch indicators
        const indRes = await fetch(`${cleanUrl}/api/v1/indicators/KRW-BTC`);
        const indData = await indRes.json();
        setIndicators(indData);

        // Fetch candles
        const canRes = await fetch(`${cleanUrl}/api/v1/candles/KRW-BTC?interval=${interval}&count=60`);
        const canData = await canRes.json();
        const processedData = canData.map((d: any) => ({
          ...d,
          range: [Math.min(d.open, d.close), Math.max(d.open, d.close)]
        }));
        setCandles(processedData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
    const fetchInterval = setInterval(fetchData, 60000); // Update every minute
    return () => clearInterval(fetchInterval);
  }, [interval]);

  const handleAiAnalysis = () => {
    setShowAI(true);
    setIsAiScanning(true);
    setTimeout(() => setIsAiScanning(false), 2000);
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newLog = {
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour12: false }),
        from: ['익명 지갑', '바이낸스', '코인베이스', '업비트'][Math.floor(Math.random() * 4)],
        to: ['익명 지갑', '빗썸', '업비트', '크라켄'][Math.floor(Math.random() * 4)],
        amount: Math.floor(Math.random() * 500),
        asset: ['BTC', 'ETH', 'SOL'][Math.floor(Math.random() * 3)],
        usdValue: Math.random() * 10000000
      };
      setLogs(prev => [...prev.slice(-20), newLog]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-6">
      {/* 상단 차트 영역 */}
      <div className={`flex-1 min-h-[400px] border rounded-2xl p-6 shadow-xl flex flex-col relative overflow-hidden transition-colors duration-300 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#161f31] border-[#2d3748]'
        }`}>
        <div className="flex justify-between items-center mb-6 z-10">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ring-1 ${theme === 'light' ? 'bg-slate-50 ring-slate-200' : 'bg-slate-800 ring-slate-700'
              }`}>
              <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-[10px] font-bold text-white">B</div>
              <span className={`font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>BTC / KRW</span>
              <PriceUpdateLabel value={btcData?.price || 92420500} prefix="₩" className="text-green-400" />
            </div>
            <div className="flex gap-1">
              {INTERVALS.map(t => (
                <button
                  key={t.value}
                  onClick={() => setIntervalState(t.value)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors ${interval === t.value
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : (theme === 'light' ? 'bg-slate-100 text-slate-500 hover:text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-white')
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-all ${showSettings
                ? 'bg-indigo-600 text-white shadow-lg'
                : (theme === 'light' ? 'bg-slate-100 text-slate-500 hover:text-indigo-600' : 'bg-slate-800 text-slate-400 hover:text-white')
                }`}
              title="지표 설정"
            >
              <Activity size={18} />
            </button>
            <button
              onClick={handleAiAnalysis}
              className={`p-2 rounded-lg transition-all group ${theme === 'light' ? 'bg-slate-100 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-indigo-600'
                }`}
              title="AI 분석"
            >
              <Cpu size={18} className="group-hover:animate-pulse" />
            </button>
          </div>
        </div>

        {/* 지표 설정 레이어 */}
        {showSettings && (
          <div className={`absolute top-24 right-6 w-48 backdrop-blur-md rounded-2xl p-4 shadow-2xl z-40 animate-in slide-in-from-top-4 duration-300 border ${theme === 'light' ? 'bg-white/95 border-slate-200' : 'bg-[#0b1426]/95 border-slate-700/50'
            }`}>
            <h4 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">기술적 지표</h4>
            <div className="space-y-2">
              {[
                { id: 'ma7', label: '7일 이평선(MA7)', color: 'bg-indigo-400' },
                { id: 'ma20', label: '20일 이평선(MA20)', color: 'bg-purple-400' },
                { id: 'rsi', label: '상대강도지수(RSI)', color: 'bg-amber-400' },
              ].map(item => (
                <label key={item.id} className="flex items-center justify-between cursor-pointer group">
                  <span className={`text-xs transition-colors ${theme === 'light' ? 'text-slate-600 group-hover:text-slate-900' : 'text-slate-300 group-hover:text-white'}`}>{item.label}</span>
                  <input
                    type="checkbox"
                    checked={(visibleIndicators as any)[item.id]}
                    onChange={() => setVisibleIndicators(prev => ({ ...prev, [item.id]: !(prev as any)[item.id] }))}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={candles} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? '#e2e8f0' : '#2d3748'} vertical={false} />
              <XAxis dataKey="time" hide />
              <YAxis domain={['auto', 'auto']} orientation="right" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'light' ? '#ffffff' : '#1e293b',
                  border: theme === 'light' ? '1px solid #e2e8f0' : '1px solid #334155',
                  borderRadius: '12px',
                  padding: '12px',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                }}
                itemStyle={{ color: theme === 'light' ? '#0f172a' : '#f8fafc', fontWeight: 'bold' }}
                labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '4px' }}
                cursor={{ fill: theme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)' }}
                formatter={(value: any, name: any, props: any) => {
                  if (name === 'range') {
                    const { open, close, high, low } = props.payload;
                    return [
                      <div className="text-[11px] space-y-1 min-w-[100px]" key="tooltip">
                        <div className="flex justify-between font-mono"><span>시:</span> ₩{open.toLocaleString()}</div>
                        <div className="flex justify-between font-mono"><span>종:</span> ₩{close.toLocaleString()}</div>
                        <div className="flex justify-between font-mono text-red-400"><span>고:</span> ₩{high.toLocaleString()}</div>
                        <div className="flex justify-between font-mono text-blue-400"><span>저:</span> ₩{low.toLocaleString()}</div>
                      </div>,
                      null
                    ];
                  }
                  return [null, null];
                }}
              />

              <Bar
                dataKey="range"
                name="range"
                shape={(props: any) => {
                  const { x, y, width, height, payload } = props;
                  if (!payload) return null;
                  const { open, close, high, low } = payload;
                  const isUp = close >= open;
                  const color = isUp ? "#ef4444" : "#3b82f6";

                  // Domain is handled by recharts, but we need to map values to coordinates
                  // Since we don't have direct access to scale in this 'shape' prop easily without more boilerplate,
                  // we'll use a trick or just render bars. 
                  // Let's use simple Bar for body and a custom shape for wicks.
                  // Actually, better to use the payload to calculate pixels if we had the scale.
                  // Recharts Bar already gives us the body.

                  const barWidth = 6;
                  const centerX = x + width / 2;

                  return (
                    <g key={`candle-${props.index}`}>
                      {/* Body */}
                      <rect
                        x={centerX - barWidth / 2}
                        y={y}
                        width={barWidth}
                        height={Math.max(1, height)}
                        fill={color}
                        rx={1}
                      />
                    </g>
                  );
                }}
              />

              <Area type="monotone" dataKey="close" stroke="#4f46e5" strokeWidth={2} fillOpacity={0.05} fill="#4f46e5" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 플로팅 지표 정보 */}
        {visibleIndicators.rsi && (
          <div className={`absolute bottom-10 left-10 p-4 backdrop-blur-md rounded-xl shadow-2xl z-20 border ${theme === 'light' ? 'bg-white/80 border-slate-200' : 'bg-[#0b1426]/80 border-slate-700'
            }`}>
            <div className="flex gap-6">
              <div>
                <p className="text-[10px] font-bold text-slate-500 mb-1">상대강도지수 (RSI 14)</p>
                <p className="text-lg font-mono font-bold text-amber-400">{indicators?.rsi ? indicators.rsi.toFixed(2) : 'Loading...'}</p>
              </div>
              <div className={`w-px ${theme === 'light' ? 'bg-slate-200' : 'bg-slate-700'}`}></div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 mb-1">이동평균선 (MA 20)</p>
                <p className="text-lg font-mono font-bold text-indigo-400">{indicators?.ma20 ? `₩${indicators.ma20.toLocaleString()}` : 'Loading...'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI 분석 모달 */}
      {showAI && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-black/60">
          <div className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative border ${theme === 'light' ? 'bg-white border-slate-100' : 'bg-[#161f31] border-[#2d3748]'
            }`}>
            <div className={`h-1 w-full bg-gradient-to-r from-indigo-500 to-purple-500 ${isAiScanning ? 'animate-pulse' : ''}`} />
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                    <Cpu size={20} />
                  </div>
                  <h2 className={`text-xl font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Fast-AI 시장 도우미</h2>
                </div>
                <button
                  onClick={() => setShowAI(false)}
                  className={`p-2 rounded-full transition-colors ${theme === 'light' ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-slate-800 text-slate-500'}`}
                >
                  <X size={20} />
                </button>
              </div>

              {isAiScanning ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin mb-6" />
                  <p className="text-slate-400 animate-pulse">현재 가격 데이터 및 지표 스캐닝 중...</p>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-2xl border border-green-500/20 text-green-400">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={20} />
                      <span className="font-bold">분석 결과: 강세 관점</span>
                    </div>
                    <span className="text-xs font-mono">Confidence: 91.2%</span>
                  </div>

                  <div className="space-y-4">
                    <div className={`p-4 rounded-2xl border ${theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-slate-800/50 border-slate-700/50'}`}>
                      <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-tight">AI 핵심 요약</h4>
                      <p className={`text-sm leading-relaxed ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                        현재 RSI가 54로 중립-강세 구간에 있으며, 1시간 봉 기준 60일 이동평균선 상단에서 안정적인 흐름을 보이고 있습니다.
                        단기 골든크로스가 포착되어 추가 상승 가능성이 높습니다.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className={`p-4 rounded-2xl border ${theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-slate-800/50 border-slate-700/50'}`}>
                        <h4 className="text-xs font-bold text-slate-500 mb-1 uppercase text-center">진입가 제안</h4>
                        <p className={`text-lg font-mono font-bold text-center ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>₩92.1M</p>
                      </div>
                      <div className={`p-4 rounded-2xl border ${theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-slate-800/50 border-slate-700/50'}`}>
                        <h4 className="text-xs font-bold text-slate-500 mb-1 uppercase text-center">목표가 제안</h4>
                        <p className="text-lg font-mono font-bold text-indigo-400 text-center">₩95.8M</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowAI(false)}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20"
                  >
                    확인 및 분석 종료
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 하단 고래 이동 로그 */}
      <div className={`h-[250px] border rounded-2xl flex flex-col shadow-2xl overflow-hidden group transition-colors duration-300 ${theme === 'light' ? 'bg-white border-slate-200 shadow-slate-200/50' : 'bg-[#0b1426] border-indigo-500/20'
        }`}>
        <div className={`border-b px-4 py-2 flex items-center justify-between ${theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-indigo-900/10 border-indigo-500/20'
          }`}>
          <div className="flex items-center gap-2 text-indigo-400">
            <Terminal size={14} />
            <span className="text-xs font-bold tracking-widest uppercase">실시간 고래 지갑 추적 터미널</span>
          </div>
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
            <div className="w-2 h-2 rounded-full bg-amber-500/50"></div>
            <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
          </div>
        </div>
        <div
          ref={terminalRef}
          className="flex-1 overflow-y-auto p-4 font-mono text-[11px] space-y-1.5 custom-scrollbar"
        >
          {logs.map((log) => (
            <div key={log.id} className={`flex gap-3 p-1 rounded transition-colors group/row ${theme === 'light' ? 'hover:bg-indigo-50' : 'hover:bg-indigo-500/5'}`}>
              <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
              <span className="text-indigo-600 font-bold shrink-0 uppercase">탐지됨:</span>
              <span className={theme === 'light' ? 'text-slate-700' : 'text-slate-300'}>
                <span className={`font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{log.amount.toLocaleString()} {log.asset}</span>
                <span className="mx-2 text-slate-500">(약 ₩{(log.usdValue * 1350 / 1000000000).toFixed(1)}십억원)</span>
                이동:
                <span className="text-amber-600/80 mx-1">{log.from}</span>
                →
                <span className="text-green-600/80 mx-1">{log.to}</span>
              </span>
              <span className="ml-auto text-indigo-500/50 group-hover/row:text-indigo-400 transition-colors cursor-pointer">온체인 확인 →</span>
            </div>
          ))}
          <div className="flex gap-2 text-green-400 animate-pulse">
            <span>_</span>
            <span>새로운 블록 데이터를 기다리는 중...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analysis;
