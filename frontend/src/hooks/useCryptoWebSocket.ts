import { useState, useEffect, useMemo, useRef } from 'react';
import { Coin } from '../types';

interface MarketData {
    [key: string]: {
        code: string;
        price: number;
        change: string;
        change_rate: number;
        volume: number;
        high: number;
        low: number;
        change_price: number;
    };
}

export const useCryptoWebSocket = () => {
    const [data, setData] = useState<MarketData>({});
    const [connected, setConnected] = useState(false);
    const [signals, setSignals] = useState<any[]>([]);
    const buffer = useRef<MarketData>({});

    useEffect(() => {
        const baseUrl = import.meta.env.VITE_API_URL || 'localhost:8000';
        const wsUrl = baseUrl.includes('://')
            ? baseUrl.replace('http', 'ws') + '/ws/market'
            : `ws://${baseUrl}/ws/market`;

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('Connected to Backend WebSocket');
            setConnected(true);
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'snapshot') {
                setData(message.data);
            } else if (message.type === 'signal') {
                setSignals((prev) => [message, ...prev].slice(0, 10));
            } else {
                // Buffer individual updates
                buffer.current[message.code] = message;
            }
        };

        ws.onclose = () => {
            console.log('Disconnected from Backend WebSocket');
            setConnected(false);
        };

        // Commit buffer to state every 500ms
        const ticker = setInterval(() => {
            if (Object.keys(buffer.current).length > 0) {
                setData(prev => ({
                    ...prev,
                    ...buffer.current
                }));
                buffer.current = {};
            }
        }, 500);

        return () => {
            ws.close();
            clearInterval(ticker);
        };
    }, []);

    // Map backend data to frontend Coin type using useMemo
    const coins = useMemo((): Coin[] => {
        return Object.values(data).map((item: MarketData[string]) => ({
            id: item.code.toLowerCase(),
            symbol: item.code.split('-')[1],
            name: getCoinName(item.code),
            price: item.price,
            change24h: item.change_rate,
            marketCap: 0,
            volume24h: item.volume,
            sparkline: [],
            category: 'Layer 1',
            high24h: item.high,
            low24h: item.low,
            changePrice: item.change_price,
        }));
    }, [data]);

    return { coins, connected, signals };
};

const getCoinName = (code: string) => {
    const names: { [key: string]: string } = {
        'KRW-BTC': '비트코인',
        'KRW-ETH': '이더리움',
        'KRW-SOL': '솔라나',
        'KRW-XRP': '리플',
        'KRW-ADA': '에이다',
        'KRW-DOGE': '도지코인',
    };
    return names[code] || code;
};
