import asyncio
import json
import logging
from typing import List, Dict

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
import websockets
from datetime import datetime
import pandas as pd
from utils.indicators import calculate_manual_rsi
from services.portfolio import calculate_portfolio
from upstash_redis import Redis

import os
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
REDIS_URL = os.getenv("REDIS_URL")
REDIS_TOKEN = os.getenv("REDIS_TOKEN")

def get_redis_client():
    if REDIS_URL and REDIS_TOKEN:
        return Redis(url=REDIS_URL, token=REDIS_TOKEN)
    return None

redis_client = get_redis_client()

app = FastAPI(title="Fast-Crypto Dash API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                # Handle stale connections
                pass

manager = ConnectionManager()

# Global state to store latest market data
market_data: Dict[str, Dict] = {}

async def signal_detector():
    """
    Periodically check indicators and broadcast signals
    """
    symbols = ["KRW-BTC", "KRW-ETH", "KRW-SOL"]
    while True:
        try:
            for symbol in symbols:
                # Fetch candles
                url = f"https://api.upbit.com/v1/candles/days?market={symbol}&count=50"
                async with httpx.AsyncClient() as client:
                    response = await client.get(url)
                    if response.status_code == 200:
                        df = pd.DataFrame(response.json())
                        prices = df['trade_price'].tolist()[::-1]
                        rsi = calculate_manual_rsi(prices)
                        
                        if rsi and (rsi < 40 or rsi > 60):  # Relaxed for testing
                            signal = {
                                "type": "signal",
                                "symbol": symbol,
                                "rsi": rsi,
                                "action": "BUY" if rsi < 40 else "SELL",
                                "message": f"{symbol} RSI is {rsi:.2f} - {'Oversold' if rsi < 40 else 'Overbought'}!",
                                "timestamp": datetime.now().strftime("%H:%M:%S")
                            }
                            await manager.broadcast(json.dumps(signal))
            
            await asyncio.sleep(60) # Check every minute
        except Exception as e:
            logger.error(f"Signal detector error: {e}")
            await asyncio.sleep(10)

async def user_alert_monitoring():
    """
    Check user-defined alerts from Supabase against live market data
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.warning("Supabase credentials missing. User alert monitoring disabled.")
        return

    while True:
        try:
            # Fetch active alerts from Supabase
            headers = {
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json"
            }
            async with httpx.AsyncClient() as client:
                resp = await client.get(f"{SUPABASE_URL}/rest/v1/alerts?is_active=eq.true", headers=headers)
                if resp.status_code == 200:
                    alerts = resp.json()
                    for alert in alerts:
                        symbol = alert.get("asset") # E.g. "BTC"
                        # Normalize symbol for comparison (Upbit uses KRW-BTC)
                        upbit_symbol = f"KRW-{symbol}" if not symbol.startswith("KRW-") else symbol
                        
                        current_data = market_data.get(upbit_symbol)
                        if not current_data:
                            continue
                        
                        current_price = current_data["price"]
                        target_price = alert["price"]
                        condition = alert["condition"] # "이상" or "이하"
                        
                        triggered = False
                        if condition == "이상" and current_price >= target_price:
                            triggered = True
                        elif condition == "이하" and current_price <= target_price:
                            triggered = True
                        
                        if triggered:
                            logger.info(f"Alert triggered! {symbol} {condition} {target_price}")
                            # 1. Insert into history
                            history_data = {
                                "asset": symbol,
                                "price": target_price,
                                "condition": condition,
                                "triggered_at": datetime.now().isoformat()
                            }
                            await client.post(f"{SUPABASE_URL}/rest/v1/alert_history", headers=headers, json=history_data)
                            
                            # 2. Mark alert as inactive
                            await client.patch(f"{SUPABASE_URL}/rest/v1/alerts?id=eq.{alert['id']}", headers=headers, json={"is_active": False})
                            
                            # 3. Broadcast to UI
                            trigger_msg = {
                                "type": "alert_triggered",
                                "message": f"{symbol} 가격이 {target_price:,.0f} {condition}에 도달했습니다!",
                                "timestamp": datetime.now().strftime("%H:%M:%S")
                            }
                            await manager.broadcast(json.dumps(trigger_msg))
            
            await asyncio.sleep(10) # Check user alerts every 10 seconds
        except Exception as e:
            logger.error(f"User alert monitoring error: {e}")
            await asyncio.sleep(10)

market_stats: Dict = {
    "market_cap": "₩3,450T",
    "market_cap_change": "+1.2%",
    "kimchi_premium": "+0.00%",
    "kimchi_change": "0.0%",
    "dominance": "52.4%",
    "liquidations_24h": "₩1,650억"
}

async def market_stats_updater():
    """
    Update global market stats from external APIs
    """
    while True:
        try:
            # 1. Fetch Kimchi Premium
            upbit_btc = market_data.get('KRW-BTC', {}).get('price')
            
            async with httpx.AsyncClient() as client:
                # APIs for market data
                binance_req = client.get("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT")
                ex_rate_req = client.get("https://api.exchangerate-api.com/v4/latest/USD")
                global_data_req = client.get("https://api.coingecko.com/api/v3/global")
                
                # Execute concurrently
                binance_resp, ex_rate_resp, global_resp = await asyncio.gather(binance_req, ex_rate_req, global_data_req)

                if binance_resp.status_code == 200 and ex_rate_resp.status_code == 200:
                    binance_price = float(binance_resp.json()['price'])
                    usd_krw = float(ex_rate_resp.json()['rates']['KRW'])
                    
                    if upbit_btc:
                        global_krw_price = binance_price * usd_krw
                        premium = ((upbit_btc - global_krw_price) / global_krw_price) * 100
                        market_stats["kimchi_premium"] = f"+{premium:.2f}%" if premium >= 0 else f"{premium:.2f}%"
                
                if global_resp.status_code == 200:
                    g_data = global_resp.json()['data']
                    total_cap_usd = g_data['total_market_cap']['usd']
                    market_stats["market_cap_change"] = f"{g_data['market_cap_change_percentage_24h_usd']:.1f}%"
                
                # Cache stats in Redis
                if redis_client:
                    redis_client.set("market_stats", json.dumps(market_stats), ex=60)
            
            await asyncio.sleep(60)
        except Exception as e:
            logger.error(f"Market stats updater error: {e}")
            await asyncio.sleep(10)

async def upbit_ws_client():
    """
    Upbit WebSocket Client to fetch real-time price data
    """
    url = "wss://api.upbit.com/websocket/v1"
    subscribe_data = [
        {"ticket": "test-portal"},
        {"type": "ticker", "codes": [
            "KRW-BTC", "KRW-ETH", "KRW-SOL", "KRW-XRP", "KRW-ADA", "KRW-DOGE", 
            "KRW-DOT", "KRW-MATIC", "KRW-STX", "KRW-AVAX", "KRW-LINK", "KRW-CHZ",
            "KRW-NEAR", "KRW-ALGO", "KRW-FLOW", "KRW-SAND", "KRW-MANA", "KRW-EGLD"
        ]}
    ]
    
    while True:
        try:
            async with websockets.connect(url) as websocket:
                await websocket.send(json.dumps(subscribe_data))
                logger.info("Connected to Upbit WebSocket")
                
                while True:
                    data = await websocket.recv()
                    data = json.loads(data)
                    code = data.get("code")
                    if code:
                        market_data[code] = {
                            "code": code,
                            "price": data.get("trade_price"),
                            "change": data.get("change"),
                            "change_rate": data.get("signed_change_rate") * 100,
                            "volume": data.get("acc_trade_volume_24h"),
                            "high": data.get("high_price"),
                            "low": data.get("low_price"),
                            "change_price": data.get("change_price")
                        }
                        # Broadcast to all connected clients
                        await manager.broadcast(json.dumps(market_data[code]))
                        
                        # Cache in Redis for persistence/scaling
                        if redis_client:
                            redis_client.set(f"price:{code}", json.dumps(market_data[code]), ex=10)
                        
        except Exception as e:
            logger.error(f"Upbit WebSocket error: {e}")
            await asyncio.sleep(5)  # Retry after 5 seconds

@app.on_event("startup")
async def startup_event():
    # Start background tasks
    asyncio.create_task(upbit_ws_client())
    asyncio.create_task(signal_detector())
    asyncio.create_task(market_stats_updater())
    asyncio.create_task(user_alert_monitoring())

@app.get("/")
async def root():
    return {"status": "ok", "message": "Fast-Crypto Dash API is running"}

@app.get("/api/v1/market-summary")
async def get_market_summary():
    return market_data

@app.get("/api/v1/market-stats")
async def get_market_stats():
    if redis_client:
        cached = redis_client.get("market_stats")
        if cached:
            return json.loads(cached)
    return market_stats

@app.get("/api/v1/indicators/{symbol}")
async def get_indicators(symbol: str):
    """
    Fetch historical data from Upbit and calculate indicators (RSI, MA)
    """
    url = f"https://api.upbit.com/v1/candles/days?market={symbol}&count=50"
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to fetch data from Upbit")
        
        data = response.json()
        df = pd.DataFrame(data)
        # Upbit returns candles in reverse order (newest first)
        df = df.iloc[::-1]
        
        prices = df['trade_price'].tolist()
        rsi = calculate_manual_rsi(prices)
        ma7 = df['trade_price'].rolling(window=7).mean().iloc[-1]
        ma20 = df['trade_price'].rolling(window=20).mean().iloc[-1]
        
        return {
            "symbol": symbol,
            "rsi": rsi,
            "ma7": ma7,
            "ma20": ma20,
            "last_price": prices[-1],
            "recommendation": "Strong Buy" if rsi < 30 else "Strong Sell" if rsi > 70 else "Hold"
        }

@app.get("/api/v1/candles/{symbol}")
async def get_candles(symbol: str, interval: str = "days", count: int = 50):
    """
    Fetch candle data for charts from Upbit with different intervals
    interval can be: '1', '5', '15', '60', '240', 'days', 'weeks', 'months'
    """
    if interval in ["1", "3", "5", "10", "15", "30", "60", "240"]:
        url = f"https://api.upbit.com/v1/candles/minutes/{interval}?market={symbol}&count={count}"
    elif interval == "days":
        url = f"https://api.upbit.com/v1/candles/days?market={symbol}&count={count}"
    elif interval == "weeks":
        url = f"https://api.upbit.com/v1/candles/weeks?market={symbol}&count={count}"
    elif interval == "months":
        url = f"https://api.upbit.com/v1/candles/months?market={symbol}&count={count}"
    else:
        url = f"https://api.upbit.com/v1/candles/days?market={symbol}&count={count}"

    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to fetch candle data")
        
        data = response.json()
        df = pd.DataFrame(data)
        df = df.iloc[::-1]
        
        chart_data = []
        for _, row in df.iterrows():
            # Formatting time based on interval
            if interval in ["days", "weeks", "months"]:
                time_str = row['candle_date_time_kst'].split('T')[0][5:] # MM-DD
            else:
                time_str = row['candle_date_time_kst'].split('T')[1][:5] # HH:MM
                
            chart_data.append({
                "time": time_str,
                "open": row['opening_price'],
                "high": row['high_price'],
                "low": row['low_price'],
                "close": row['trade_price'],
                "vol": row['candle_acc_trade_volume']
            })
        return chart_data

@app.get("/api/v1/portfolio")
async def get_portfolio():
    """
    Get user portfolio with real-time value calculation
    """
    mock_assets = [
        {"name": "비트코인", "pair": "KRW-BTC", "amount": 0.5, "buy_price": 95000000, "color": "#f59e0b"},
        {"name": "이더리움", "pair": "KRW-ETH", "amount": 10.0, "buy_price": 3200000, "color": "#6366f1"},
        {"name": "솔라나", "pair": "KRW-SOL", "amount": 150.0, "buy_price": 140000, "color": "#14b8a6"},
        {"name": "리플", "pair": "KRW-XRP", "amount": 5000.0, "buy_price": 850, "color": "#3b82f6"}
    ]
    return calculate_portfolio(mock_assets, market_data)

@app.websocket("/ws/market")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send current snapshot on connect
        if market_data:
            await websocket.send_text(json.dumps({"type": "snapshot", "data": market_data}))
        
        while True:
            # Just keep connection alive, data is sent via manager.broadcast
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
