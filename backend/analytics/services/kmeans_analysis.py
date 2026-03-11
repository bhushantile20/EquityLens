import yfinance as yf
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from portfolio.models import Stock

def run_kmeans_clustering(portfolio_id: int, k: int):
    # Fetch all stocks in the portfolio
    stocks = Stock.objects.filter(portfolio_id=portfolio_id)
    if not stocks.exists():
        raise Exception("No stocks found in this portfolio.")
    
    if len(stocks) < k:
        raise Exception(f"Number of stocks ({len(stocks)}) is less than the number of clusters ({k}).")
    
    data = []
    
    for stock in stocks:
        try:
            ticker = yf.Ticker(stock.symbol)
            history = ticker.history(period="1y")
            
            if history.empty:
                continue
                
            prices = history["Close"].tolist()
            if len(prices) < 2:
                continue
                
            current_price = float(prices[-1])
            one_year_ago_price = float(prices[0])
            
            # Calculate 1 Year Return %
            return_pct = (current_price - one_year_ago_price) / one_year_ago_price if one_year_ago_price > 0 else 0
            
            # Calculate Volatility (Standard deviation of daily returns)
            daily_returns = history["Close"].pct_change().dropna()
            volatility = float(daily_returns.std() * np.sqrt(252)) # Annualized volatility
            
            info = ticker.info
            pe_ratio = info.get("trailingPE")
            if pe_ratio is None:
                pe_ratio = stock.analytics.pe_ratio if hasattr(stock, 'analytics') and stock.analytics.pe_ratio is not None else 15.0
                
            market_cap = info.get("marketCap", 1e9)
            if market_cap is None:
                market_cap = 1e9
                
            data.append({
                "symbol": stock.symbol,
                "company_name": stock.company_name,
                "return": return_pct,
                "volatility": volatility,
                "pe": float(pe_ratio),
                "market_cap": float(market_cap),
                "current_price": current_price
            })
        except Exception as e:
            continue
        
    if len(data) < k:
        raise Exception(f"Not enough valid data points ({len(data)}) to form {k} clusters.")
        
    df = pd.DataFrame(data)
    
    features = ["return", "volatility", "pe", "market_cap"]
    X = df[features].copy()
    
    # Handle missing values
    X = X.fillna(X.mean())
    df[features] = X
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    clusters = kmeans.fit_predict(X_scaled)
    df["cluster"] = clusters
    
    # Calculate cluster summaries for automatic labeling
    mean_ret = df["return"].mean()
    mean_vol = df["volatility"].mean()
    mean_pe = df["pe"].mean()
    
    cluster_summaries = {}
    for c in range(k):
        cluster_df = df[df["cluster"] == c]
        avg_ret = cluster_df["return"].mean()
        avg_vol = cluster_df["volatility"].mean()
        avg_pe = cluster_df["pe"].mean()
        
        label = "Stable Stocks"
        
        # High return + high volatility
        if avg_ret > mean_ret and avg_vol > mean_vol:
            label = "Aggressive Growth"
        # Low volatility
        elif avg_vol < mean_vol and avg_ret > 0:
            label = "Defensive"
        # Low PE + good return
        elif avg_pe < mean_pe and avg_ret > 0:
            label = "Value Stocks"
        # High volatility + low return
        elif avg_ret < 0 and avg_vol > mean_vol:
            label = "Risky Stocks"
        # High PE + High return + moderate/low vol
        elif avg_pe > mean_pe and avg_ret > mean_ret:
            label = "Growth Stocks"
            
        cluster_summaries[c] = label
        
    response_clusters = []
    for c in range(k):
        c_stocks = df[df["cluster"] == c]["symbol"].tolist()
        response_clusters.append({
            "cluster_id": c,
            "stocks": c_stocks,
            "label": cluster_summaries[c]
        })
        
    cluster_data = []
    for _, row in df.iterrows():
        cluster_data.append({
            "symbol": row["symbol"],
            "cluster": int(row["cluster"]),
            "return": round(float(row["return"]), 4),
            "volatility": round(float(row["volatility"]), 4),
            "pe": round(float(row["pe"]), 2),
            "market_cap": float(row["market_cap"])
        })
        
    return {
        "clusters": response_clusters,
        "cluster_data": cluster_data
    }
