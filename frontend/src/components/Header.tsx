
import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { MOCK_COINS } from '../services/mockData';
import { Coin } from '../types';

interface HeaderProps { }

const Header: React.FC<HeaderProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Coin[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = MOCK_COINS.filter(coin =>
        coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filtered);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (symbol: string) => {
    navigate(`/markets/${symbol.toLowerCase()}`);
    setSearchQuery('');
    setShowResults(false);
  };

  const getPageTitle = (pathname: string) => {
    if (pathname.startsWith('/markets/') && pathname.length > 9) return '코인 상세';
    switch (pathname) {
      case '/': return '대시보드';
      case '/markets': return '시장 시세';
      case '/analysis': return '전문 분석';
      case '/signals': return '신호 및 알림';
      case '/mypage': return '자산 관리';
      default: return 'FastCrypto';
    }
  };

  const title = getPageTitle(location.pathname);

  return (
    <header className={`h-20 backdrop-blur-md border-b px-8 flex items-center justify-between sticky top-0 z-30 transition-colors duration-300 ${theme === 'light' ? 'bg-white/80 border-slate-200 shadow-sm shadow-slate-200/20' : 'bg-[#0b1426]/80 border-[#2d3748]'
      }`}>
      <div className="flex items-center gap-6">
        <h2 className={`text-2xl font-bold tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
          {title}
        </h2>
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-xs font-bold border border-green-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          실시간 연결 안정적
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative hidden md:block" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery && setShowResults(true)}
            placeholder="코인명 또는 심볼 검색..."
            className={`pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-64 transition-all border ${theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-900' : 'bg-slate-800/50 border-slate-700 text-white'
              }`}
          />

          {/* 검색 결과 드롭다운 */}
          {showResults && searchResults.length > 0 && (
            <div className={`absolute top-full left-0 right-0 mt-2 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#161f31] border-[#2d3748]'
              }`}>
              <div className="max-h-80 overflow-y-auto">
                {searchResults.map((coin) => (
                  <div
                    key={coin.id}
                    onClick={() => handleResultClick(coin.symbol)}
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-indigo-600/10 cursor-pointer border-b last:border-0 group ${theme === 'light' ? 'border-slate-50' : 'border-slate-700/30'
                      }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-1 group-hover:ring-indigo-500/50 transition-all ${theme === 'light' ? 'bg-slate-100 ring-slate-200 text-slate-600' : 'bg-slate-800 ring-slate-700 text-slate-300'
                      }`}>
                      {coin.symbol[0]}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-bold group-hover:text-indigo-600 transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-slate-200'}`}>{coin.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono uppercase">{coin.symbol}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-bold ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>₩{coin.price.toLocaleString()}</p>
                      <p className={`text-[10px] font-mono ${coin.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {coin.change24h >= 0 ? '+' : ''}{coin.change24h}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showResults && searchResults.length === 0 && (
            <div className={`absolute top-full left-0 right-0 mt-2 rounded-xl p-4 text-center shadow-2xl z-50 border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#161f31] border-[#2d3748]'
              }`}>
              <p className="text-xs text-slate-500">검색 결과가 없습니다.</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button className={`p-2.5 rounded-xl transition-all relative ${theme === 'light' ? 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}>
            <Bell size={20} />
            <span className={`absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 ${theme === 'light' ? 'border-white' : 'border-[#0b1426]'}`}></span>
          </button>
          <div className={`h-8 w-px mx-2 ${theme === 'light' ? 'bg-slate-200' : 'bg-slate-700'}`}></div>
          <div className="flex items-center gap-3 pl-2 group cursor-pointer">
            <div className="text-right">
              <p className={`text-sm font-semibold group-hover:text-indigo-600 transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>김지능 개발자</p>
              <p className="text-[10px] text-slate-500">회원 등급: 플래티넘</p>
            </div>
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg ring-2 ${theme === 'light' ? 'ring-slate-100' : 'ring-slate-800'
              }`}>
              김
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
