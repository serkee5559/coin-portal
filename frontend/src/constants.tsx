
import React from 'react';
import { LayoutDashboard, BarChart3, PieChart, Bell, Newspaper, Settings } from 'lucide-react';

export const COLORS = {
  bg: '#0b1426',
  card: '#161f31',
  border: '#2d3748',
  textMain: '#e2e8f0',
  textDim: '#94a3b8',
  up: '#10b981', // 네온 그린 (상승)
  down: '#ef4444', // 비비드 레드 (하락)
};

export const NAVIGATION_ITEMS = [
  { id: 'DASHBOARD', label: '대시보드', icon: <LayoutDashboard size={20} /> },
  { id: 'MARKETS', label: '시장 시세', icon: <BarChart3 size={20} /> },
  { id: 'ANALYSIS', label: '전문 분석', icon: <Newspaper size={20} /> },
  { id: 'SIGNALS', label: '신호 및 알림', icon: <Bell size={20} /> },
  { id: 'MYPAGE', label: '자산 관리', icon: <PieChart size={20} /> },
];
