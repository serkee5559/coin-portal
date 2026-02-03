
export interface Coin {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  sparkline: number[];
  category: 'Layer 1' | 'DeFi' | 'AI' | 'NFT' | 'Gaming';
  high24h?: number;
  low24h?: number;
  changePrice?: number;
  whitepaperUrl?: string;
  websiteUrl?: string;
}

export interface WhaleMovement {
  id: string;
  timestamp: string;
  from: string;
  to: string;
  amount: number;
  asset: string;
  usdValue: number;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  source: string;
  time: string;
  tags: string[];
  url?: string;
}

export enum Page {
  DASHBOARD = 'DASHBOARD',
  MARKETS = 'MARKETS',
  ANALYSIS = 'ANALYSIS',
  SIGNALS = 'SIGNALS',
  MYPAGE = 'MYPAGE'
}
