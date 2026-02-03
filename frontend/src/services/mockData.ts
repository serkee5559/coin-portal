
import { Coin, WhaleMovement, NewsItem } from '../types';

export const MOCK_COINS: Coin[] = [
  { id: 'btc', symbol: 'BTC', name: '비트코인', price: 92420500, change24h: 2.45, marketCap: 1200000000000, volume24h: 35000000000, sparkline: [90000000, 91000000, 92450000, 92000000, 93000000, 92420500], category: 'Layer 1', whitepaperUrl: 'https://bitcoin.org/bitcoin.pdf', websiteUrl: 'https://bitcoin.org' },
  { id: 'eth', symbol: 'ETH', name: '이더리움', price: 4821150, change24h: -1.22, marketCap: 410000000000, volume24h: 18000000000, sparkline: [4900000, 4880000, 4850000, 4860000, 4830000, 4821150], category: 'Layer 1', whitepaperUrl: 'https://ethereum.org/en/whitepaper/', websiteUrl: 'https://ethereum.org' },
  { id: 'sol', symbol: 'SOL', name: '솔라나', price: 212880, change24h: 5.67, marketCap: 64000000000, volume24h: 4200000000, sparkline: [190000, 192000, 208000, 205000, 210000, 212880], category: 'Layer 1', whitepaperUrl: 'https://solana.com/solana-whitepaper.pdf', websiteUrl: 'https://solana.com' },
  { id: 'link', symbol: 'LINK', name: '체인링크', price: 26250, change24h: 0.45, marketCap: 10000000000, volume24h: 600000000, sparkline: [25500, 25800, 26100, 26000, 26200, 26250], category: 'DeFi', whitepaperUrl: 'https://chain.link/whitepaper', websiteUrl: 'https://chain.link' },
  { id: 'near', symbol: 'NEAR', name: '니어프로토콜', price: 9780, change24h: -3.41, marketCap: 7200000000, volume24h: 450000000, sparkline: [10200, 10100, 10000, 9900, 9800, 9780], category: 'Layer 1', whitepaperUrl: 'https://near.org/papers/the-near-blockchain-platform-whitepaper/', websiteUrl: 'https://near.org' },
  { id: 'rndr', symbol: 'RNDR', name: '렌더토큰', price: 14450, change24h: 8.12, marketCap: 4000000000, volume24h: 300000000, sparkline: [13200, 13500, 13800, 14100, 14300, 14450], category: 'AI', whitepaperUrl: 'https://renderfoundation.com/whitepaper', websiteUrl: 'https://renderfoundation.com' },
  { id: 'fet', symbol: 'FET', name: '페치', price: 3340, change24h: 12.55, marketCap: 2000000000, volume24h: 200000000, sparkline: [2900, 3000, 3100, 3200, 3300, 3340], category: 'AI', whitepaperUrl: 'https://fetch.ai/whitepaper', websiteUrl: 'https://fetch.ai' },
  { id: 'uni', symbol: 'UNI', name: '유니스왑', price: 13150, change24h: -2.15, marketCap: 5500000000, volume24h: 150000000, sparkline: [13500, 13400, 13300, 13200, 13200, 13150], category: 'DeFi', whitepaperUrl: 'https://uniswap.org/whitepaper.pdf', websiteUrl: 'https://uniswap.org' },
  { id: 'pepe', symbol: 'PEPE', name: '페페', price: 0.01242, change24h: 4.56, marketCap: 3500000000, volume24h: 600000000, sparkline: [0.010, 0.011, 0.012, 0.0118, 0.0122, 0.01242], category: 'NFT', whitepaperUrl: 'https://pepe.vip', websiteUrl: 'https://pepe.vip' }
];

export const MOCK_NEWS: NewsItem[] = [
  {
    id: 'n1',
    title: '블룸버그 분석가 "이더리움 현물 ETF 승인 확률 75%로 급증"',
    content: '블룸버그 인텔리전스의 시니어 ETF 분석가 에릭 발추나스(Eric Balchunas)는 SEC의 이더리움 현물 ETF 승인 확률을 기존 25%에서 75%로 대폭 상향 조정했습니다. 이는 최근 SEC가 거래소들에게 19b-4 양식 업데이트를 요청했다는 루머에 기반한 것으로 알려졌습니다.',
    source: '코인포스트',
    time: '12분 전',
    tags: ['ETF', 'ETH'],
    url: 'https://example.com/news/1'
  },
  {
    id: 'n2',
    title: '미 SEC 의장 게리 겐슬러, 가상자산 거래소 규제 강화 의지 재확인',
    content: '게리 겐슬러 SEC 의장은 의회 청문회에서 가상자산 시장의 대부분이 증권법의 적용을 받아야 한다고 재차 강조하며, 특히 중앙화 거래소들에 대한 강력한 규제 체계 도입이 시급하다고 발언했습니다.',
    source: '연합인포맥스',
    time: '45분 전',
    tags: ['규제', 'SEC'],
    url: 'https://example.com/news/2'
  },
  {
    id: 'n3',
    title: '솔라나 네트워크, 밈코인 열풍에 일일 활성 주소수 역대 최고치 경신',
    content: '솔라나 생태계 내 밈코인 거래가 폭발적으로 증가함에 따라 네트워크의 일일 활성 주소수가 200만 개를 돌파하며 사상 최고치를 기록했습니다. 이는 다른 주요 메인넷들과 비교해도 압도적인 수준입니다.',
    source: '더블록',
    time: '1시간 전',
    tags: ['Solana', '네트워크'],
    url: 'https://example.com/news/3'
  },
  {
    id: 'n4',
    title: '엔비디아 실적 발표 후 AI 관련 토큰 일제히 급등세',
    content: '엔비디아의 1분기 실적이 시장 예상치를 훨씬 웃도는 호실적을 기록하자, 월드코인(WLD), 렌더(RNDR), 페치(FET) 등 AI 관련 가상자산들이 10~20% 이상의 급격한 상승세를 보이고 있습니다.',
    source: '로이터',
    time: '2시간 전',
    tags: ['AI', '테크'],
    url: 'https://example.com/news/4'
  },
];

export const MOCK_PORTFOLIO = [
  { name: '비트코인', value: 45000000, color: '#f59e0b' },
  { name: '이더리움', value: 25000000, color: '#6366f1' },
  { name: '솔라나', value: 15000000, color: '#10b981' },
  { name: '기타', value: 10000000, color: '#94a3b8' },
];

// Fix for missing export: Added MOCK_WHALE_MOVEMENTS
export const MOCK_WHALE_MOVEMENTS: WhaleMovement[] = [
  { id: 'w1', timestamp: '14:20:05', from: '익명 지갑', to: '바이낸스', amount: 120, asset: 'BTC', usdValue: 11000000 },
  { id: 'w2', timestamp: '14:22:30', from: '코인베이스', to: '익명 지갑', amount: 4500, asset: 'ETH', usdValue: 21600000 },
  { id: 'w3', timestamp: '14:25:12', from: '업비트', to: '빗썸', amount: 25000, asset: 'SOL', usdValue: 5300000 },
];
