import pandas as pd
# import pandas_ta as ta (removed due to installation issues)

# def calculate_indicators(df: pd.DataFrame):
#     """
#     Calculate MA, RSI, and Bollinger Bands using pandas_ta
#     df must have 'close' column
#     """
#     if df.empty:
#         return {}
#     
#     # Simple Moving Averages
#     df['ma7'] = ta.sma(df['close'], length=7)
#     df['ma20'] = ta.sma(df['close'], length=20)
#     
#     # RSI
#     df['rsi'] = ta.rsi(df['close'], length=14)
#     
#     # Bollinger Bands
#     bbands = ta.bbands(df['close'], length=20, std=2)
#     if bbands is not None:
#         df = pd.concat([df, bbands], axis=1)
#     
#     return df.tail(1).to_dict(orient='records')[0]

def calculate_manual_rsi(prices, period=14):
    """
    Manual RSI calculation in case pandas_ta is not available or for demo
    """
    if len(prices) < period + 1:
        return None
    
    deltas = pd.Series(prices).diff().dropna()
    gain = deltas.where(deltas > 0, 0)
    loss = -deltas.where(deltas < 0, 0)
    
    avg_gain = gain.rolling(window=period).mean()
    avg_loss = loss.rolling(window=period).mean()
    
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    return rsi.iloc[-1]
