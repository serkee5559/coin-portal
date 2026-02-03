
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useSettings } from '../context/SettingsContext';

const FearGreedGauge: React.FC<{ value: number }> = ({ value }) => {
  const { theme } = useSettings();

  const getColor = (val: number) => {
    if (val < 25) return '#ef4444';
    if (val < 45) return '#f97316';
    if (val < 55) return '#eab308';
    if (val < 75) return '#84cc16';
    return '#22c55e';
  };

  const getStatusText = (val: number) => {
    if (val < 25) return '극도의 공포';
    if (val < 45) return '공포';
    if (val < 55) return '중립';
    if (val < 75) return '탐욕';
    return '극도의 탐욕';
  };

  // Create segments for the background gauge
  const segments = [
    { value: 25, color: '#ef4444', label: 'Ext. Fear' },
    { value: 20, color: '#f97316' },
    { value: 10, color: '#eab308' },
    { value: 20, color: '#84cc16' },
    { value: 25, color: '#22c55e', label: 'Ext. Greed' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full relative">
      <div className="w-full h-48 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {/* Background Gauge Track */}
            <Pie
              data={segments}
              cx="50%"
              cy="80%"
              startAngle={180}
              endAngle={0}
              innerRadius={65}
              outerRadius={85}
              dataKey="value"
              stroke="none"
              isAnimationActive={false}
            >
              {segments.map((s, i) => (
                <Cell key={i} fill={s.color} opacity={0.2} />
              ))}
            </Pie>
            {/* Main Value Gauge */}
            <Pie
              data={[
                { value: value },
                { value: 100 - value }
              ]}
              cx="50%"
              cy="80%"
              startAngle={180}
              endAngle={0}
              innerRadius={65}
              outerRadius={85}
              dataKey="value"
              stroke="none"
              animationDuration={1500}
              animationEasing="ease-out"
            >
              <Cell fill={getColor(value)} />
              <Cell fill="transparent" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Needle */}
        <div
          className={`absolute left-1/2 bottom-[20%] w-1 h-20 rounded-full origin-bottom transition-transform duration-[1500ms] ease-out shadow-lg ${theme === 'light' ? 'bg-slate-400' : 'bg-white'
            }`}
          style={{
            transform: `translateX(-50%) rotate(${(value / 100) * 180 - 90}deg)`,
            zIndex: 10
          }}
        />
        <div className={`absolute left-1/2 bottom-[18%] w-4 h-4 rounded-full -translate-x-1/2 shadow-xl z-20 ${theme === 'light' ? 'bg-slate-300' : 'bg-slate-200'
          }`} />
      </div>

      <div className="text-center -mt-4 relative z-30">
        <p className={`text-5xl font-extrabold font-mono tracking-tighter drop-shadow-md ${theme === 'light' ? 'text-slate-900' : 'text-white'
          }`}>
          {value}
        </p>
        <p className={`text-base font-bold mt-1 px-4 py-1 rounded-full backdrop-blur-sm border shadow-sm ${theme === 'light' ? 'bg-white/80' : 'bg-slate-800/80'
          }`}
          style={{ color: getColor(value), borderColor: `${getColor(value)}40` }}>
          {getStatusText(value)}
        </p>
      </div>
    </div>
  );
};

export default FearGreedGauge;
