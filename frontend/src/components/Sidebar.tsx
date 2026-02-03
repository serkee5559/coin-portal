
import React from 'react';
import { Zap } from 'lucide-react';
import { NAVIGATION_ITEMS } from '../constants';
import { Link, useLocation } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

interface SidebarProps { }

const Sidebar: React.FC<SidebarProps> = () => {
  const location = useLocation();
  const { theme } = useSettings();

  const getPath = (id: string) => {
    if (id === 'DASHBOARD') return '/';
    return `/${id.toLowerCase()}`;
  };

  const isActive = (id: string) => {
    const path = getPath(id);
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className={`w-64 border-r hidden md:flex flex-col transition-colors duration-300 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#0f172a] border-[#2d3748]'
      }`}>
      <div className={`h-20 px-6 flex items-center ${theme === 'light' ? 'bg-indigo-600' : ''}`}>
        <Link to="/" className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${theme === 'light' ? 'bg-white/20' : 'bg-indigo-600 shadow-indigo-500/20'
            }`}>
            <Zap size={24} className="text-white fill-current" />
          </div>
          <h1 className="text-xl font-bold text-white transition-colors">
            FastCrypto
          </h1>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {NAVIGATION_ITEMS.map((item) => (
          <Link
            key={item.id}
            to={getPath(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive(item.id)
              ? (theme === 'light' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-indigo-600/10 text-indigo-400 shadow-sm border border-indigo-500/20')
              : (theme === 'light' ? 'text-slate-500 hover:bg-slate-50 hover:text-slate-900' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200')
              }`}
          >
            <span className={`${isActive(item.id) ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
              {item.icon}
            </span>
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className={`p-4 border-t ${theme === 'light' ? 'border-slate-100' : 'border-[#2d3748]'}`}>
        <div className={`${theme === 'light' ? 'bg-slate-50' : 'bg-slate-800/50'} rounded-xl p-4`}>
          <p className="text-xs text-slate-500 mb-2">프로 플랜</p>
          <p className={`text-sm font-semibold mb-3 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>실시간 AI 인사이트를 잠금 해제하세요</p>
          <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-bold text-white transition-colors shadow-lg shadow-indigo-600/20">
            지금 업그레이드
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
