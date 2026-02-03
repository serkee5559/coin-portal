
import React, { useState, useEffect } from 'react';
import FearGreedGauge from '../components/FearGreedGauge';
import Sparkline from '../components/Sparkline';
import PriceUpdateLabel from '../components/PriceUpdateLabel';
import { MOCK_COINS, MOCK_NEWS } from '../services/mockData';
import { ArrowUpRight, ArrowDownRight, Zap, TrendingUp, ShieldAlert, Globe, X, ExternalLink, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCryptoWebSocket } from '../hooks/useCryptoWebSocket';
import { NewsItem } from '../types';
import { useSettings } from '../context/SettingsContext';

interface DashboardProps { }

const Dashboard: React.FC<DashboardProps> = () => {
  const navigate = useNavigate();
  const { theme } = useSettings();
  const { coins: wsCoins } = useCryptoWebSocket();
  const [coins, setCoins] = useState(MOCK_COINS);
  const [marketStats, setMarketStats] = useState<any>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const cleanUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        const response = await fetch(`${cleanUrl}/api/v1/market-stats`);
        const data = await response.json();
        setMarketStats(data);
      } catch (error) {
        console.error('Failed to fetch market stats:', error);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (wsCoins.length > 0) {
      setCoins(prevCoins => {
        return prevCoins.map(mockCoin => {
          const wsCoin = wsCoins.find(wc => wc.symbol === mockCoin.symbol);
          if (wsCoin) {
            return {
              ...mockCoin,
              price: wsCoin.price,
              change24h: wsCoin.change24h,
              volume24h: wsCoin.volume24h,
            };
          }
          return mockCoin;
        });
      });
    }
  }, [wsCoins]);

  return (
    <div className="space-y-6">
      {/* 상단 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`border rounded-2xl p-6 shadow-xl transition-colors duration-300 ${theme === 'light' ? 'bg-white border-slate-200 shadow-slate-200/50' : 'bg-[#161f31] border-[#2d3748] shadow-black/20'
          }`}>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
              <TrendingUp size={24} />
            </div>
            <span className={`text-xs font-bold ${marketStats?.market_cap_change?.startsWith('-') ? 'text-red-400 bg-red-400/10' : 'text-green-400 bg-green-400/10'} px-2 py-1 rounded-lg`}>
              {marketStats?.market_cap_change || '+1.2%'}
            </span>
          </div>
          <p className="text-slate-400 text-sm font-medium mb-1">전체 시가총액</p>
          <h3 className={`text-2xl font-bold font-mono ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{marketStats?.market_cap || '₩3,450T'}</h3>
        </div>

        <div className={`border rounded-2xl p-6 shadow-xl transition-colors duration-300 ${theme === 'light' ? 'bg-white border-slate-200 shadow-slate-200/50' : 'bg-[#161f31] border-[#2d3748] shadow-black/20'
          }`}>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
              <Zap size={24} />
            </div>
          </div>
          <p className="text-slate-400 text-sm font-medium mb-1">김치 프리미엄</p>
          <h3 className="text-2xl font-bold font-mono text-amber-400">{marketStats?.kimchi_premium || '+0.00%'}</h3>
        </div>

        <div className={`border rounded-2xl p-6 shadow-xl transition-colors duration-300 ${theme === 'light' ? 'bg-white border-slate-200 shadow-slate-200/50' : 'bg-[#161f31] border-[#2d3748] shadow-black/20'
          }`}>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
              <Globe size={24} />
            </div>
          </div>
          <p className="text-slate-400 text-sm font-medium mb-1">비트코인 도미넌스</p>
          <h3 className={`text-2xl font-bold font-mono ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{marketStats?.dominance || '54.2%'}</h3>
        </div>

        <div className={`border rounded-2xl p-6 shadow-xl transition-colors duration-300 ${theme === 'light' ? 'bg-white border-slate-200 shadow-slate-200/50' : 'bg-[#161f31] border-[#2d3748] shadow-black/20'
          }`}>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-red-500/10 rounded-xl text-red-400">
              <ShieldAlert size={24} />
            </div>
          </div>
          <p className="text-slate-400 text-sm font-medium mb-1">24시간 청산액</p>
          <h3 className={`text-2xl font-bold font-mono text-red-400`}>{marketStats?.liquidations_24h || '₩1,650억'}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 공포/탐욕 지수 */}
        <div className={`border rounded-2xl p-6 shadow-xl lg:col-span-1 transition-colors duration-300 ${theme === 'light' ? 'bg-white border-slate-200 shadow-slate-200/50' : 'bg-[#161f31] border-[#2d3748] shadow-black/20'
          }`}>
          <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            공포/탐욕 지수
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          </h3>
          <FearGreedGauge value={68} />
          <div className={`mt-8 pt-8 border-t space-y-4 ${theme === 'light' ? 'border-slate-100' : 'border-slate-700/50'}`}>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">어제 기준</span>
              <span className="font-semibold text-green-400 font-mono">65</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">지난주 기준</span>
              <span className="font-semibold text-amber-400 font-mono">52</span>
            </div>
          </div>
        </div>

        {/* 주요 자산 시황 */}
        <div className={`border rounded-2xl p-6 shadow-xl lg:col-span-2 transition-colors duration-300 ${theme === 'light' ? 'bg-white border-slate-200 shadow-slate-200/50' : 'bg-[#161f31] border-[#2d3748] shadow-black/20'
          }`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className={`text-lg font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>실시간 시장 현황</h3>
            <button
              onClick={() => navigate('/markets')}
              className="text-sm text-indigo-400 font-semibold hover:underline"
            >
              전체 보기
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className={`${theme === 'light' ? 'text-slate-400 border-slate-100' : 'text-slate-500 border-slate-700/50'} text-xs font-bold uppercase tracking-wider border-b`}>
                  <th className="pb-4">자산</th>
                  <th className="pb-4">현재가</th>
                  <th className="pb-4">24시간 변동</th>
                  <th className="pb-4 text-right">트렌드</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme === 'light' ? 'divide-slate-50' : 'divide-slate-700/30'}`}>
                {coins.slice(0, 6).map((coin) => (
                  <tr
                    key={coin.id}
                    onClick={() => navigate(`/markets/${coin.symbol.toLowerCase()}`)}
                    className={`group transition-colors cursor-pointer ${theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-slate-800/20'
                      }`}
                  >
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-1 ${theme === 'light' ? 'bg-slate-50 text-slate-600 ring-slate-100' : 'bg-slate-800 text-slate-300 ring-slate-700'
                          }`}>
                          {coin.symbol[0]}
                        </div>
                        <div>
                          <p className={`font-bold text-sm ${theme === 'light' ? 'text-slate-900' : 'text-slate-200'}`}>{coin.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{coin.symbol}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <PriceUpdateLabel
                        value={coin.price}
                        prefix="₩"
                        className={`font-bold text-sm ${theme === 'light' ? 'text-slate-900' : 'text-slate-200'}`}
                      />
                    </td>
                    <td className="py-4">
                      <div className={`flex items-center text-sm font-mono font-semibold ${coin.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {coin.change24h >= 0 ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
                        <PriceUpdateLabel value={Math.abs(coin.change24h)} isPercent={true} className="p-0 bg-transparent" />
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end">
                        <Sparkline
                          data={coin.sparkline}
                          color={coin.change24h >= 0 ? '#10b981' : '#ef4444'}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 실시간 인사이트/뉴스 */}
        <div className={`border rounded-2xl p-6 shadow-xl transition-colors duration-300 ${theme === 'light' ? 'bg-white border-slate-200 shadow-slate-200/50' : 'bg-[#161f31] border-[#2d3748] shadow-black/20'
          }`}>
          <h3 className={`text-lg font-bold mb-6 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>최신 인사이트</h3>
          <div className="space-y-4">
            {MOCK_NEWS.slice(0, 3).map((news) => (
              <div
                key={news.id}
                onClick={() => setSelectedNews(news)}
                className={`p-4 rounded-xl border transition-all cursor-pointer group ${theme === 'light' ? 'bg-slate-50 border-slate-100 hover:border-indigo-500/30' : 'bg-slate-800/30 border-slate-700/50 hover:border-indigo-500/30'
                  }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-2">
                    {news.tags.map(tag => (
                      <span key={tag} className="text-[10px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded font-bold uppercase">{tag}</span>
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-500">{news.time}</span>
                </div>
                <h4 className={`text-sm font-bold group-hover:text-indigo-600 transition-colors line-clamp-2 leading-relaxed ${theme === 'light' ? 'text-slate-900' : 'text-slate-200'
                  }`}>
                  {news.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-2 font-medium">출처: {news.source}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI 시장 예측 리포트 */}
        <div className={`border rounded-2xl p-6 shadow-xl overflow-hidden relative transition-colors duration-300 ${theme === 'light' ? 'bg-white border-slate-200 shadow-slate-200/50' : 'bg-[#161f31] border-[#2d3748] shadow-black/20'
          }`}>
          <div className={`absolute top-0 right-0 p-8 opacity-10 ${theme === 'light' ? 'text-indigo-200' : 'text-white'}`}>
            <TrendingUp size={120} />
          </div>
          <h3 className={`text-lg font-bold mb-6 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>AI 시장 예측 리포트</h3>
          <div className="relative z-10">
            <div className="flex items-center gap-4 p-4 bg-indigo-600/10 rounded-xl border border-indigo-500/20 mb-6">
              <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0">
                <Zap size={24} fill="white" />
              </div>
              <div>
                <p className={`text-sm font-bold ${theme === 'light' ? 'text-indigo-900' : 'text-white'}`}>강세장 전환 신호 포착</p>
                <p className="text-xs text-slate-400">모델 신뢰도: 87%</p>
              </div>
            </div>
            <p className={`text-sm leading-relaxed mb-6 ${theme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>
              자체 ML 모델 분석 결과, 레이어 1 자산들에 대한 강한 매집세가 포착되었습니다. 온체인 데이터는 향후 48-72시간 내 주요 저항선 돌파 가능성을 시사합니다.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-3 rounded-lg text-center ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-800/50'
                }`}>
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">목표가 (Target)</p>
                <p className="text-lg font-bold font-mono text-green-400">₩98,500,000</p>
              </div>
              <div className={`p-3 rounded-lg text-center ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-800/50'
                }`}>
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">지지선 (Support)</p>
                <p className="text-lg font-bold font-mono text-indigo-400">₩89,200,000</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 뉴스 상세 모달 */}
      {selectedNews && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm bg-black/60 animate-in fade-in duration-300">
          <div
            className="bg-[#161f31] border border-[#2d3748] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-2 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-2">
                  {selectedNews.tags.map(tag => (
                    <span key={tag} className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-lg font-bold uppercase tracking-wider">
                      {tag}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => setSelectedNews(null)}
                  className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold leading-tight mb-4 text-white">
                {selectedNews.title}
              </h2>

              <div className="flex items-center gap-4 text-slate-400 text-xs mb-8">
                <div className="flex items-center gap-1.5">
                  <Clock size={14} />
                  <span>{selectedNews.time}</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-slate-600" />
                <span>출처: {selectedNews.source}</span>
              </div>

              <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50 mb-8">
                <p className="text-slate-300 leading-relaxed text-sm whitespace-pre-wrap">
                  {selectedNews.content}
                </p>
              </div>

              <div className="flex gap-3 mt-auto">
                {selectedNews.url && (
                  <a
                    href={selectedNews.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20 group"
                  >
                    <span>기사 전문 보기</span>
                    <ExternalLink size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                )}
                <button
                  onClick={() => setSelectedNews(null)}
                  className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-bold transition-all border border-slate-700"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
