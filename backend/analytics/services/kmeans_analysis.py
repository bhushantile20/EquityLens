import yfinance as yf
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.metrics import silhouette_score
from portfolio.models import Stock
import logging
import time
from utils.cache_manager import load_cache, save_cache

logger = logging.getLogger(__name__)

# Cache settings
NIFTY50_CACHE_FILE = "nifty50_analysis.json"
NIFTY50_TTL = 14400  # 4 hours

NIFTY_50_TICKERS = [
    "RELIANCE.NS",
    "TCS.NS",
    "HDFCBANK.NS",
    "ICICIBANK.NS",
    "INFY.NS",
    "ITC.NS",
    "LT.NS",
    "SBIN.NS",
    "AXISBANK.NS",
    "KOTAKBANK.NS",
    "BHARTIARTL.NS",
    "ASIANPAINT.NS",
    "MARUTI.NS",
    "TITAN.NS",
    "BAJFINANCE.NS",
    "ULTRACEMCO.NS",
    "NESTLEIND.NS",
    "HCLTECH.NS",
    "WIPRO.NS",
    "SUNPHARMA.NS",
    "POWERGRID.NS",
    "ONGC.NS",
    "NTPC.NS",
    "COALINDIA.NS",
    "BAJFINANCE.NS",
    "MARUTI.NS",
    "ULTRACEMCO.NS",
    "HINDALCO.NS",
    "TECHM.NS",
    "DRREDDY.NS",
    "DIVISLAB.NS",
    "EICHERMOT.NS",
    "HEROMOTOCO.NS",
    "HINDALCO.NS",
    "CIPLA.NS",
    "APOLLOHOSP.NS",
    "BRITANNIA.NS",
    "TATASTEEL.NS",
    "HDFCLIFE.NS",
    "SBILIFE.NS",
    "BAJAJFINSV.NS",
    "UPL.NS",
    "INDUSINDBK.NS",
    "SHREECEM.NS",
    "HINDUNILVR.NS",
    "BPCL.NS",
    "IOC.NS",
    "GAIL.NS",
    "DABUR.NS",
]

CLUSTER_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"]
CLUSTER_NAMES = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta"]


def run_kmeans_clustering(portfolio_id: int, k: int):
    # Fetch all stocks in the portfolio
    stocks = Stock.objects.filter(portfolio_id=portfolio_id)
    if not stocks.exists():
        raise Exception("No stocks found in this portfolio.")

    if len(stocks) < k:
        raise Exception(
            f"Number of stocks ({len(stocks)}) is less than the number of clusters ({k})."
        )

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
            return_pct = (
                (current_price - one_year_ago_price) / one_year_ago_price
                if one_year_ago_price > 0
                else 0
            )

            # Calculate Volatility (Standard deviation of daily returns)
            daily_returns = history["Close"].pct_change().dropna()
            volatility = float(
                daily_returns.std() * np.sqrt(252)
            )  # Annualized volatility

            info = ticker.info
            pe_ratio = info.get("trailingPE")
            if pe_ratio is None:
                pe_ratio = (
                    stock.analytics.pe_ratio
                    if hasattr(stock, "analytics")
                    and stock.analytics.pe_ratio is not None
                    else 15.0
                )

            market_cap = info.get("marketCap", 1e9)
            if market_cap is None:
                market_cap = 1e9

            data.append(
                {
                    "symbol": stock.symbol,
                    "company_name": stock.company_name,
                    "return": return_pct,
                    "volatility": volatility,
                    "pe": float(pe_ratio),
                    "market_cap": float(market_cap),
                    "current_price": current_price,
                }
            )
        except Exception as e:
            continue

    if len(data) < k:
        raise Exception(
            f"Not enough valid data points ({len(data)}) to form {k} clusters."
        )

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
        response_clusters.append(
            {"cluster_id": c, "stocks": c_stocks, "label": cluster_summaries[c]}
        )

    cluster_data = []
    for _, row in df.iterrows():
        cluster_data.append(
            {
                "symbol": row["symbol"],
                "cluster": int(row["cluster"]),
                "return": round(float(row["return"]), 4),
                "volatility": round(float(row["volatility"]), 4),
                "pe": round(float(row["pe"]), 2),
                "market_cap": float(row["market_cap"]),
            }
        )

    return {"clusters": response_clusters, "cluster_data": cluster_data}


# ==================== NIFTY50 PCA + K-MEANS CLUSTERING ====================


def compute_nifty50_features():
    """
    Compute improved financial features for Nifty50 stocks.
    Returns DataFrame with features for clustering.

    Features:
    1. 1Y Return
    2. 3M Momentum
    3. Daily Volatility (log returns)
    4. PE Ratio
    5. Distance from 52W High
    6. Distance from 52W Low
    7. Volume Momentum (30d avg / 90d avg)
    """
    logger.info("Computing improved features for Nifty50 stocks...")
    features_data = []

    try:
        # Batch download data
        all_hist = yf.download(
            NIFTY_50_TICKERS,
            period="1y",
            interval="1d",
            group_by="ticker",
            threads=True,
        )

        if all_hist.empty:
            logger.error("Failed to download historical data")
            return None

        for ticker_symbol in NIFTY_50_TICKERS:
            try:
                # Get historical data
                df_hist = (
                    all_hist[ticker_symbol]
                    if ticker_symbol in all_hist.columns
                    else all_hist
                )
                if isinstance(df_hist, pd.DataFrame):
                    df_hist = df_hist.dropna(subset=["Close"])
                else:
                    continue

                if len(df_hist) < 90:  # Need at least 90 days for volume momentum
                    continue

                # Get current info
                tick = yf.Ticker(ticker_symbol)
                info = tick.info

                close_prices = df_hist["Close"]
                volumes = df_hist.get("Volume", pd.Series([1] * len(df_hist)))
                current_price = info.get("currentPrice") or close_prices.iloc[-1]

                # 1️⃣ 1Y Return
                first_price = close_prices.iloc[0]
                last_price = close_prices.iloc[-1]
                return_1y = ((last_price - first_price) / first_price) * 100

                # 2️⃣ 3M Momentum (last 3 months = ~60 trading days)
                if len(close_prices) >= 60:
                    price_3m_ago = close_prices.iloc[-60]
                    momentum_3m = ((last_price - price_3m_ago) / price_3m_ago) * 100
                else:
                    momentum_3m = return_1y

                # 3️⃣ Daily Volatility (using log returns for better statistical properties)
                log_returns = np.log(close_prices / close_prices.shift(1)).dropna()
                volatility = log_returns.std() * np.sqrt(252) * 100  # Annualized

                # 4️⃣ PE Ratio
                pe = info.get("trailingPE")
                if pe is None or pe <= 0:
                    pe = 20.0  # Default value

                # 5️⃣ Distance from 52W High
                high_52w = info.get("fiftyTwoWeekHigh") or df_hist["High"].max()
                if high_52w and current_price:
                    dist_52w_high = ((current_price - high_52w) / high_52w) * 100
                else:
                    dist_52w_high = 0

                # 6️⃣ Distance from 52W Low
                low_52w = info.get("fiftyTwoWeekLow") or df_hist["Low"].min()
                if low_52w and current_price:
                    dist_52w_low = ((current_price - low_52w) / low_52w) * 100
                else:
                    dist_52w_low = 0

                # 7️⃣ Volume Momentum (30d avg volume / 90d avg volume)
                if len(volumes) >= 90:
                    avg_vol_30d = volumes.iloc[-30:].mean()
                    avg_vol_90d = volumes.iloc[-90:].mean()
                    volume_momentum = (
                        (avg_vol_30d / avg_vol_90d - 1) * 100 if avg_vol_90d > 0 else 0
                    )
                else:
                    volume_momentum = 0

                features_data.append(
                    {
                        "symbol": ticker_symbol.replace(".NS", ""),
                        "full_symbol": ticker_symbol,
                        "company_name": info.get("longName") or ticker_symbol.replace(".NS", ""),
                        "return_1y": return_1y,
                        "momentum_3m": momentum_3m,
                        "volatility": volatility,
                        "pe": pe,
                        "dist_52w_high": dist_52w_high,
                        "dist_52w_low": dist_52w_low,
                        "volume_momentum": volume_momentum,
                    }
                )

            except Exception as e:
                logger.warning(
                    f"Error computing features for {ticker_symbol}: {str(e)}"
                )
                continue

        if not features_data:
            logger.error("No features computed")
            return None

        df = pd.DataFrame(features_data)
        logger.info(f"Computed features for {len(df)} stocks")
        return df

    except Exception as e:
        logger.error(f"Error in compute_nifty50_features: {str(e)}")
        return None


def perform_nifty50_clustering(k=4, bypass_cache=False):
    """
    Perform PCA + K-Means clustering on Nifty50 stocks.

    Args:
        k: Number of clusters (2-6)
        bypass_cache: Whether to bypass cache

    Returns:
        Dict with clustering results
    """
    # Use disk cache
    cache_filename = f"nifty50_k{k}.json"
    if not bypass_cache:
        cached_result = load_cache(cache_filename, NIFTY50_TTL)
        if cached_result:
            logger.info(f"Returning cached clustering results for k={k}")
            return cached_result

    logger.info(f"Computing Nifty50 clustering for k={k}...")

    try:
        # Compute features
        df = compute_nifty50_features()
        if df is None or df.empty:
            return {"error": "Failed to compute features"}

        # Improved feature columns (7 features for better clustering)
        feature_cols = [
            "return_1y",
            "momentum_3m",
            "volatility",
            "pe",
            "dist_52w_high",
            "dist_52w_low",
            "volume_momentum",
        ]
        X = df[feature_cols].values

        # Handle NaN/Inf values robustly
        X = np.nan_to_num(X, nan=0, posinf=100, neginf=-100)

        # Standardize features (CRITICAL for K-Means)
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        # Apply K-Means on standardized features for BETTER clustering
        # Using improved parameters: k-means++, n_init=50, max_iter=500
        kmeans = KMeans(
            n_clusters=k,
            init="k-means++",  # Better initialization
            n_init=50,  # More initializations for better convergence
            max_iter=500,  # More iterations for better convergence
            random_state=42,
        )
        clusters = kmeans.fit_predict(X_scaled)

        # Calculate silhouette score (quality metric)
        silhouette_avg = silhouette_score(X_scaled, clusters)
        logger.info(f"Silhouette score for k={k}: {silhouette_avg:.4f}")

        # Apply PCA for visualization AFTER clustering
        pca = PCA(n_components=2, random_state=42)
        X_pca = pca.fit_transform(X_scaled)

        pc1_variance = pca.explained_variance_ratio_[0] * 100
        pc2_variance = pca.explained_variance_ratio_[1] * 100
        total_variance = pc1_variance + pc2_variance

        # Build stocks data with PCA coordinates
        stocks_data = []
        for idx, row in df.iterrows():
            stocks_data.append(
                {
                    "symbol": row["symbol"],
                    "full_symbol": row["full_symbol"],
                    "company_name": row.get("company_name", row["symbol"]),
                    "pc1": round(float(X_pca[idx, 0]), 4),
                    "pc2": round(float(X_pca[idx, 1]), 4),
                    "cluster": int(clusters[idx]),
                    "return_1y": round(row["return_1y"], 2),
                    "momentum_3m": round(row["momentum_3m"], 2),
                    "volatility": round(row["volatility"], 2),
                    "pe": round(row["pe"], 2),
                    "dist_52w_high": round(row["dist_52w_high"], 2),
                    "dist_52w_low": round(row["dist_52w_low"], 2),
                    "volume_momentum": round(row["volume_momentum"], 2),
                }
            )

        # Compute cluster summaries
        clusters_summary = []
        for cluster_id in range(k):
            cluster_indices = np.where(clusters == cluster_id)[0]
            cluster_stocks = [df.iloc[i]["symbol"] for i in cluster_indices]

            if len(cluster_indices) > 0:
                cluster_data = df.iloc[cluster_indices]
                avg_return = cluster_data["return_1y"].mean()
                avg_momentum = cluster_data["momentum_3m"].mean()
                avg_volatility = cluster_data["volatility"].mean()

                clusters_summary.append(
                    {
                        "id": cluster_id,
                        "name": CLUSTER_NAMES[cluster_id % len(CLUSTER_NAMES)],
                        "color": CLUSTER_COLORS[cluster_id % len(CLUSTER_COLORS)],
                        "count": len(cluster_indices),
                        "avg_return": round(avg_return, 2),
                        "avg_momentum": round(avg_momentum, 2),
                        "avg_volatility": round(avg_volatility, 2),
                        "stocks": sorted(cluster_stocks),
                    }
                )

        result = {
            "pc1_variance": round(pc1_variance, 1),
            "pc2_variance": round(pc2_variance, 1),
            "total_variance": round(total_variance, 1),
            "silhouette_score": round(silhouette_avg, 4),  # Quality metric
            "k": k,
            "stocks": stocks_data,
            "clusters": clusters_summary,
        }

        # Cache the result
        save_cache(cache_filename, result)

        logger.info(
            f"Nifty50 clustering completed for k={k} with {len(stocks_data)} stocks (silhouette={silhouette_avg:.4f})"
        )
        return result

    except Exception as e:
        logger.error(f"Error in perform_nifty50_clustering: {str(e)}")
        return {"error": str(e)}
