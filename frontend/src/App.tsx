
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Markets from './pages/Markets';
import CoinDetail from './pages/CoinDetail';
import Analysis from './pages/Analysis';
import Signals from './pages/Signals';
import MyPage from './pages/MyPage';
import { useSettings } from './context/SettingsContext';
import { Routes, Route, Navigate } from 'react-router-dom';

const App: React.FC = () => {
  const { theme, compactMode } = useSettings();

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-[#0b1426] text-slate-200'
      } ${compactMode ? 'compact' : ''}`}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className={`flex-1 overflow-y-auto scroll-smooth ${compactMode ? 'p-3 lg:p-4' : 'p-6 lg:p-8'}`}>
          <div className="max-w-[1600px] mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/markets" element={<Markets />} />
              <Route path="/markets/:symbol" element={<CoinDetail />} />
              <Route path="/analysis" element={<Analysis />} />
              <Route path="/signals" element={<Signals />} />
              <Route path="/mypage" element={<MyPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
