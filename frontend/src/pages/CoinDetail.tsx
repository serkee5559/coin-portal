
import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCryptoWebSocket } from '../hooks/useCryptoWebSocket';
import { MOCK_COINS } from '../services/mockData';
import { ArrowLeft, TrendingUp, TrendingDown, Activity, DollarSign, BarChart2, ExternalLink } from 'lucide-react';
import Sparkline from '../components/Sparkline';
import PriceUpdateLabel from '../components/PriceUpdateLabel';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line } from 'recharts';
import { useState } from 'react';

const CoinDetail: React.FC = () => {
    const { symbol } = useParams<{ symbol: string }>();
    const navigate = useNavigate();
    const { coins: wsCoins } = useCryptoWebSocket();
    const [chartType, setChartType] = useState<'area' | 'candle'>('candle');

    const coin = useMemo(() => {
        const mockCoin = MOCK_COINS.find(c => c.symbol.toLowerCase() === symbol?.toLowerCase());
        if (!mockCoin) return null;

        const wsCoin = wsCoins.find(wc => wc.symbol.toLowerCase() === symbol?.toLowerCase());
        const finalCoin = wsCoin ? {
            ...mockCoin,
            ...wsCoin,
            sparkline: (wsCoin.sparkline && wsCoin.sparkline.length > 0) ? wsCoin.sparkline : mockCoin.sparkline
        } : mockCoin;

        // Stable random generator based on symbol and index
        const getSeededRandom = (seedStr: string, index: number) => {
            const seed = seedStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + index;
            const x = Math.sin(seed) * 10000;
            return x - Math.floor(x);
        };

        const baseSparkline = finalCoin.sparkline.length > 0 ? finalCoin.sparkline : [finalCoin.price * 0.95, finalCoin.price];
        const targetCount = 12;
        const trendPoints: number[] = [];

        for (let i = 0; i < targetCount; i++) {
            const progress = i / (targetCount - 1);
            const floatIndex = progress * (baseSparkline.length - 1);
            const index = Math.floor(floatIndex);
            const nextIndex = Math.min(index + 1, baseSparkline.length - 1);
            const weight = floatIndex - index;
            const interpolatedPrice = baseSparkline[index] * (1 - weight) + baseSparkline[nextIndex] * weight;
            trendPoints.push(interpolatedPrice);
        }

        let runningClose = trendPoints[0] * 0.98;
        const symbolSeed = symbol || 'default';

        const candleData = trendPoints.map((targetPrice, i, arr) => {
            const open = runningClose;
            let close: number;

            if (i === targetCount - 1) {
                close = finalCoin.price;
            } else {
                const deterministicNoise = 1 + (getSeededRandom(symbolSeed, i) - 0.5) * 0.03;
                close = targetPrice * deterministicNoise;
            }
            runningClose = close;

            const seedVol = getSeededRandom(symbolSeed, i + 100);
            const volatility = i === targetCount - 1 ? 0.01 : 0.01 + seedVol * 0.02;
            const high = Math.max(open, close) * (1 + (i === targetCount - 1 ? 0.002 : seedVol * volatility));
            const low = Math.min(open, close) * (1 - (i === targetCount - 1 ? 0.002 : (1 - seedVol) * volatility));

            const windowSize = 4;
            const window = arr.slice(Math.max(0, i - windowSize + 1), i + 1);
            const sma = window.reduce((a, b) => a + b, 0) / window.length;

            return {
                time: `${i + 1}주`,
                open,
                close,
                high,
                low,
                range: [open, close],
                price: close,
                sma
            };
        });

        return { ...finalCoin, candleData };
    }, [symbol, wsCoins]);

    if (!coin) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
                <p className="text-xl font-bold mb-4">코인을 찾을 수 없습니다.</p>
                <button
                    onClick={() => navigate('/markets')}
                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all font-bold"
                >
                    <ArrowLeft size={18} /> 목록으로 돌아가기
                </button>
            </div>
        );
    }

    const isPositive = coin.change24h >= 0;

    const Candlestick = (props: any) => {
        const { x, y, width, height, payload } = props;
        if (x === undefined || y === undefined || !payload) return null;

        const { open, close, high, low } = payload;
        const isUp = close >= open;
        const color = isUp ? "#ef4444" : "#3b82f6";

        // Use a small price diff to avoid division by zero
        const priceDiff = Math.abs(open - close) || (close * 0.001);
        const ratio = Math.abs(height) / priceDiff;

        const highWickHeight = (high - Math.max(open, close)) * ratio;
        const lowWickHeight = (Math.min(open, close) - low) * ratio;

        return (
            <g>
                <line
                    x1={x + width / 2}
                    y1={y - highWickHeight}
                    x2={x + width / 2}
                    y2={y + height + lowWickHeight}
                    stroke={color}
                    strokeWidth={1.5}
                />
                <rect
                    x={x + 1}
                    y={y}
                    width={Math.max(0, width - 2)}
                    height={Math.max(2, height)}
                    fill={color}
                />
            </g>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Navigation */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/markets')}
                    className="p-2 bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-700/50"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600/20 flex items-center justify-center font-bold text-lg text-indigo-400 border border-indigo-500/20">
                        {coin.symbol[0]}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            {coin.name} <span className="text-slate-500 text-sm font-mono font-normal">{coin.symbol}</span>
                        </h1>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold px-2 py-0.5 bg-slate-800 text-slate-400 rounded-md border border-slate-700">
                                Rank #1
                            </span>
                            <span className="text-xs font-bold px-2 py-0.5 bg-indigo-600/10 text-indigo-400 rounded-md border border-indigo-500/20">
                                {coin.category}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Price Card & Chart */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#161f31] border border-[#2d3748] rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Activity size={120} className="text-indigo-500" />
                        </div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <p className="text-slate-400 font-medium mb-1">실시간 현재가</p>
                                    <div className="flex items-baseline gap-4">
                                        <PriceUpdateLabel
                                            value={coin.price}
                                            prefix="₩"
                                            className="text-4xl md:text-5xl font-black text-white tracking-tight"
                                        />
                                        <div className={`flex items-center gap-1 text-lg font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                            {isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                                            {isPositive ? '+' : ''}{coin.change24h.toFixed(2)}%
                                        </div>
                                    </div>
                                </div>
                                <div className="hidden md:block text-right">
                                    <div className="flex bg-slate-800/50 p-1 rounded-lg border border-slate-700/50 mb-2 invisible md:visible">
                                        <button
                                            onClick={() => setChartType('area')}
                                            className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${chartType === 'area' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            선
                                        </button>
                                        <button
                                            onClick={() => setChartType('candle')}
                                            className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${chartType === 'candle' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            봉
                                        </button>
                                    </div>
                                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">24시간 변동액</p>
                                    <p className={`text-xl font-mono font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                        {isPositive ? '+' : ''}{coin.changePrice?.toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {/* Detailed Chart */}
                            <div className="h-[300px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    {chartType === 'area' ? (
                                        <AreaChart
                                            data={coin.candleData}
                                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                        >
                                            <defs>
                                                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
                                            <XAxis dataKey="time" hide />
                                            <YAxis domain={['auto', 'auto']} hide />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                                                itemStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                                                labelStyle={{ color: '#94a3b8', fontSize: '10px' }}
                                                formatter={(value: number) => [`₩${value.toLocaleString()}`, '가격']}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="price"
                                                stroke={isPositive ? "#10b981" : "#ef4444"}
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorPrice)"
                                                animationDuration={1500}
                                            />
                                        </AreaChart>
                                    ) : (
                                        <ComposedChart
                                            data={coin.candleData}
                                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
                                            <XAxis dataKey="time" hide />
                                            <YAxis domain={['auto', 'auto']} hide />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '12px' }}
                                                itemStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                                                labelStyle={{ color: '#94a3b8', fontSize: '10px' }}
                                                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                                formatter={(value: any, name: any, props: any) => {
                                                    if (name !== 'range') return [null, null];
                                                    const { open, close, high, low } = props.payload;
                                                    return [
                                                        <div className="text-[11px] space-y-1.5 min-w-[120px]">
                                                            <div className="flex justify-between gap-4"><span className="text-slate-400">시가</span> <span className="font-mono text-white">₩{open.toLocaleString()}</span></div>
                                                            <div className="flex justify-between gap-4"><span className="text-slate-400">종가</span> <span className="font-mono text-white">₩{close.toLocaleString()}</span></div>
                                                            <div className="flex justify-between gap-4"><span className="text-red-400">고가</span> <span className="font-mono text-white">₩{high.toLocaleString()}</span></div>
                                                            <div className="flex justify-between gap-4"><span className="text-blue-400">저가</span> <span className="font-mono text-white">₩{low.toLocaleString()}</span></div>
                                                        </div>,
                                                        null
                                                    ];
                                                }}
                                            />
                                            {/* Hidden lines for domain calculation */}
                                            <Line dataKey="high" stroke="none" dot={false} activeDot={false} tooltipType="none" />
                                            <Line dataKey="low" stroke="none" dot={false} activeDot={false} tooltipType="none" />

                                            {/* Moving Average Line overlay */}
                                            <Line
                                                type="monotone"
                                                dataKey="sma"
                                                stroke="#f59e0b"
                                                strokeWidth={2}
                                                dot={false}
                                                animationDuration={1500}
                                                tooltipType="none"
                                            />

                                            <Bar
                                                name="range"
                                                dataKey="range"
                                                shape={<Candlestick />}
                                            />
                                        </ComposedChart>
                                    )}
                                </ResponsiveContainer>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-slate-700/50 mt-6">
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase mb-1">24시간 최고가</p>
                                    <p className="text-lg font-mono font-bold text-red-400">
                                        ₩{coin.high24h?.toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase mb-1">24시간 최저가</p>
                                    <p className="text-lg font-mono font-bold text-indigo-400">
                                        ₩{coin.low24h?.toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase mb-1">거래대금(24h)</p>
                                    <p className="text-lg font-mono font-bold text-slate-200">
                                        ₩{(coin.volume24h / 1e8).toFixed(1)}억
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase mb-1">알림 설정</p>
                                    <button className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                                        가격 도달 시 알림 받기
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Column */}
                <div className="space-y-6">
                    <div className="bg-[#161f31] border border-[#2d3748] rounded-[2rem] p-6 shadow-xl">
                        <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider flex items-center gap-2">
                            <BarChart2 size={16} className="text-indigo-400" /> 시장 데이터
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-sm">시가총액</span>
                                <span className="font-mono font-bold text-slate-200">
                                    ₩{(coin.marketCap / 1e12).toFixed(1)}T
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-sm">완전 희석 시총</span>
                                <span className="font-mono font-bold text-slate-200">
                                    ₩{(coin.marketCap * 1.1 / 1e12).toFixed(1)}T
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-sm">유통 공급량</span>
                                <span className="font-mono font-bold text-slate-200">
                                    19,650,230 {coin.symbol}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#161f31] border border-[#2d3748] rounded-[2rem] p-6 shadow-xl">
                        <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider flex items-center gap-2">
                            <TrendingUp size={16} className="text-green-400" /> 주간 트렌드
                        </h3>
                        <div className="h-24 w-full flex items-center justify-center">
                            <div className="w-full h-full scale-y-125">
                                <Sparkline data={coin.sparkline.length > 0 ? coin.sparkline : [100, 110, 105, 120, 115, 130]} color={isPositive ? '#10b981' : '#ef4444'} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Description / Extra Info */}
            <div className="bg-[#161f31] border border-[#2d3748] rounded-[2rem] p-8 shadow-xl">
                <h3 className="text-lg font-bold mb-4">{coin.name} 정보</h3>
                <p className="text-slate-400 leading-relaxed">
                    {coin.name}({coin.symbol})은 탈중앙화된 가상자산으로, 블록체인 기술을 기반으로 투명하고 안전한 거래를 지원합니다.
                    현재 시가총액 기준 시장에서 매우 중요한 위치를 차지하고 있으며, 실시간 시세 변동과 기술적 분석을 통한 투자 전략 수립이 필수적입니다.
                    해당 자산은 {coin.category} 부문에서 선도적인 역할을 하고 있습니다.
                </p>
                <div className="flex gap-4 mt-6">
                    <button
                        onClick={() => coin.whitepaperUrl && window.open(coin.whitepaperUrl, '_blank')}
                        className={`px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${!coin.whitepaperUrl && 'opacity-50 cursor-not-allowed'}`}
                    >
                        백서 보기 <ExternalLink size={14} />
                    </button>
                    <button
                        onClick={() => coin.websiteUrl && window.open(coin.websiteUrl, '_blank')}
                        className={`px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${!coin.websiteUrl && 'opacity-50 cursor-not-allowed'}`}
                    >
                        공식 홈페이지 <ExternalLink size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CoinDetail;
