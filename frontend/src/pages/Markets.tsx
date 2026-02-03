
import React, { useState, useEffect } from 'react';
import { MOCK_COINS } from '../services/mockData';
import PriceUpdateLabel from '../components/PriceUpdateLabel';
import Sparkline from '../components/Sparkline';
import { Search, Filter, Star, ChevronRight } from 'lucide-react';

const CATEGORIES = ['전체', 'Layer 1', 'DeFi', 'AI', 'NFT', 'Gaming'];

import { useCryptoWebSocket } from '../hooks/useCryptoWebSocket';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { Coin } from '../types';

interface MarketRowProps {
  coin: Coin;
  index: number;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

const MarketRow = React.memo(({ coin, index, isFavorite, onToggleFavorite }: MarketRowProps) => {
  const navigate = useNavigate();
  const { theme } = useSettings();
  return (
    <tr
      onClick={() => navigate(`/markets/${coin.symbol.toLowerCase()}`)}
      className={`transition-all cursor-pointer border-b ${theme === 'light'
          ? 'hover:bg-slate-50 border-slate-100'
          : 'hover:bg-slate-800/40 border-slate-700/30'
        }`}
    >
      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => onToggleFavorite(coin.id)} className={`transition-colors ${isFavorite ? 'text-amber-400' : (theme === 'light' ? 'text-slate-300 hover:text-slate-400' : 'text-slate-600 hover:text-slate-400')}`}>
          <Star size={16} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-slate-500">{index + 1}</span>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-inner ${theme === 'light' ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400'
            }`}>
            {coin.symbol[0]}
          </div>
          <div>
            <p className={`font-bold text-sm ${theme === 'light' ? 'text-slate-900' : 'text-slate-200'}`}>{coin.name}</p>
            <p className="text-[10px] text-slate-500 font-mono uppercase">{coin.symbol}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <PriceUpdateLabel value={coin.price} prefix="₩" className="font-bold text-sm" />
      </td>
      <td className="px-6 py-4">
        <div className={`flex items-center text-sm font-mono font-bold ${coin.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          <PriceUpdateLabel value={coin.change24h} isPercent={true} className="bg-transparent p-0" />
        </div>
      </td>
      <td className="px-6 py-4">
        <div className={`text-xs font-mono ${coin.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {coin.change24h >= 0 ? '+' : ''}{coin.changePrice?.toLocaleString()}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-1">
          <div className="text-[10px] text-red-400 font-mono">H: ₩{coin.high24h?.toLocaleString()}</div>
          <div className="text-[10px] text-indigo-400 font-mono">L: ₩{coin.low24h?.toLocaleString()}</div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm font-mono text-slate-500 uppercase">
        ₩{(coin.marketCap / 1000000000).toFixed(1)}B
      </td>
      <td className="px-6 py-4 text-sm font-mono text-slate-500 uppercase">
        ₩{(coin.volume24h / 1000000).toFixed(1)}M
      </td>
      <td className="px-6 py-4">
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-slate-700/50 border-slate-600 text-slate-300'
          }`}>
          {coin.category}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex justify-end items-center gap-4">
          <Sparkline data={coin.sparkline} color={coin.change24h >= 0 ? '#10b981' : '#ef4444'} />
          <ChevronRight size={16} className="text-slate-700 group-hover:text-indigo-400 transition-colors" />
        </div>
      </td>
    </tr>
  );
});

const Markets: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'change' | 'cap'>('name');
  const { coins: wsCoins } = useCryptoWebSocket();
  const { theme } = useSettings();
  const [favorites, setFavorites] = useState<string[]>([]);

  const coins = React.useMemo(() => {
    return MOCK_COINS.map(mockCoin => {
      const wsCoin = wsCoins.find(wc => wc.symbol === mockCoin.symbol);
      if (wsCoin) {
        return {
          ...mockCoin,
          price: wsCoin.price,
          change24h: wsCoin.change24h,
          volume24h: wsCoin.volume24h,
          high24h: wsCoin.high24h,
          low24h: wsCoin.low24h,
          changePrice: wsCoin.changePrice,
        };
      }
      return mockCoin;
    });
  }, [wsCoins]);

  const filteredCoins = React.useMemo(() => {
    let result = activeCategory === '전체'
      ? coins
      : coins.filter(c => c.category === activeCategory);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q)
      );
    }

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'price': return b.price - a.price;
        case 'change': return b.change24h - a.change24h;
        case 'cap': return b.marketCap - a.marketCap;
        default: return a.name.localeCompare(b.name);
      }
    });
  }, [coins, activeCategory, searchQuery, sortBy]);

  const toggleFavorite = React.useCallback((id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  }, []);

  return (
    <div className="space-y-6">
      {/* 카테고리 탭 */}
      <div className={`flex flex-col sm:flex-row gap-4 justify-between items-center p-2 rounded-2xl border transition-colors duration-300 shadow-lg ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#161f31] border-[#2d3748]'
        }`}>
        <div className="flex overflow-x-auto no-scrollbar gap-1 p-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${activeCategory === cat
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : (theme === 'light' ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800')
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex gap-2 px-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="시장 검색..."
              className={`pl-9 pr-4 py-1.5 border rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 outline-none w-48 transition-all ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400' : 'bg-slate-800/50 border-slate-700 text-white'
                }`}
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className={`px-3 py-1.5 border rounded-lg text-xs transition-colors outline-none cursor-pointer ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-600 hover:text-indigo-600' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
          >
            <option value="name">이름순</option>
            <option value="price">가격순</option>
            <option value="change">변동률순</option>
            <option value="cap">시총순</option>
          </select>
        </div>
      </div>

      {/* 메인 테이블 */}
      <div className={`border rounded-2xl shadow-xl overflow-hidden transition-colors duration-300 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#161f31] border-[#2d3748]'
        }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className={`text-xs font-bold uppercase tracking-wider border-b ${theme === 'light' ? 'bg-slate-50 text-slate-500 border-slate-100' : 'bg-slate-800/30 text-slate-500 border-slate-700/50'
              }`}>
              <tr>
                <th className="px-6 py-4 w-12"></th>
                <th className="px-6 py-4"># 이름</th>
                <th className="px-6 py-4">가격</th>
                <th className="px-6 py-4">24시간 변동</th>
                <th className="px-6 py-4">전일대비 금액</th>
                <th className="px-6 py-4">고가/저가(24h)</th>
                <th className="px-6 py-4">시가총액</th>
                <th className="px-6 py-4">거래대금(24h)</th>
                <th className="px-6 py-4">카테고리</th>
                <th className="px-6 py-4 text-right">최근 7일 추이</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'light' ? 'divide-slate-100' : 'divide-slate-700/30'}`}>
              {filteredCoins.map((coin, index) => (
                <MarketRow
                  key={coin.id}
                  coin={coin}
                  index={index}
                  isFavorite={favorites.includes(coin.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Markets;
