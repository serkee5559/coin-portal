from typing import List, Dict

def calculate_portfolio(assets: List[Dict], market_data: Dict):
    total_value = 0
    calculated_assets = []
    
    for asset in assets:
        pair = asset.get('pair')
        # Get current price from global market_data snapshot
        current_data = market_data.get(pair, {})
        current_price = current_data.get('price', asset['buy_price'])
        
        total_investment = asset['buy_price'] * asset['amount']
        current_total_value = current_price * asset['amount']
        profit_loss = current_total_value - total_investment
        profit_rate = (profit_loss / total_investment) * 100 if total_investment > 0 else 0
        
        calculated_assets.append({
            **asset,
            'current_price': current_price,
            'current_value': current_total_value,
            'profit_loss': profit_loss,
            'profit_rate': profit_rate
        })
        total_value += current_total_value
        
    return {
        'total_value': total_value,
        'assets': calculated_assets
    }
