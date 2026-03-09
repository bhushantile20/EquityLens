from typing import Dict, Any
import pandas as pd
from django.forms.models import model_to_dict

from portfolio.models import Stock
from stocks.services.cluster import apply_kmeans_clustering
from stocks.services.regression import apply_linear_regression
from stocks.services.logistic import apply_logistic_regression

def run_portfolio_analysis(portfolio_id: int) -> Dict[str, Any]:
    """
    Runs an ML-based Portfolio Analysis Pipeline.
    Steps:
    1. Fetch stocks by portfolio_id
    2. Convert to Pandas DataFrame
    3. Apply KMeans clustering
    4. Apply Linear Regression (Predict current_price)
    5. Apply Logistic Regression (Predict buy_probability & signal)
    6. Generate correlation matrix
    Returns dict containing enriched stock list and correlation matrix.
    """
    
    # 1. Fetch Data
    qs = Stock.objects.filter(portfolio_id=portfolio_id)
    if not qs.exists():
        return {"stocks": [], "correlation": {}}
        
    stocks_list = [model_to_dict(s) for s in qs]
    df = pd.DataFrame(stocks_list)
    
    # Required columns guarantee
    required_cols = ['symbol', 'current_price', 'min_price', 'max_price', 'pe_ratio']
    for col in required_cols:
        if col not in df.columns:
            df[col] = 0.0
            
    # For fields that might not be directly on the Stock model but via relationships like discount_level
    # Wait, in the portfolio.models.py Stock model did NOT have pe_ratio or discount_level.
    # But it might be injected or exist, let's pull them safely if we have an analytics related model or attribute
    # In earlier search, Stock had an 'analytics' relationship giving pe_ratio & discount_level.
    # We will build the dict manually to ensure we pull those.
    
    stocks_data = []
    for s in qs:
        data = model_to_dict(s)
        # Check if analytics exist
        analytics = getattr(s, 'analytics', None)
        pe_ratio = 0.0
        discount_level = "LOW"
        min_p = 0.0
        max_p = 0.0
        if analytics:
            pe_ratio = analytics.pe_ratio if analytics.pe_ratio else 0.0
            discount_level = analytics.discount_level if analytics.discount_level else "LOW"
            # min_price and max_price logic is in the serializer usually, we can extract from graph_data
            prices = analytics.graph_data.get("price", []) if analytics.graph_data else []
            valid_prices = [float(p) for p in prices if isinstance(p, (int, float))]
            if valid_prices:
                min_p = min(valid_prices)
                max_p = max(valid_prices)
        
        data['pe_ratio'] = pe_ratio
        data['discount_level'] = discount_level
        data['min_price'] = min_p
        data['max_price'] = max_p
        stocks_data.append(data)

    df = pd.DataFrame(stocks_data)
        
    # Feature Engineering
    def parse_discount(level):
        lvl = str(level).upper()
        if lvl == "HIGH": return 1.0
        if lvl == "MEDIUM": return 0.5
        return 0.0

    df['discount_numeric'] = df['discount_level'].apply(parse_discount)
    df['price_range'] = df['max_price'] - df['min_price']
    df['volatility_ratio'] = df.apply(
        lambda row: row['price_range'] / row['current_price'] if row['current_price'] and row['current_price'] > 0 else 0.0, 
        axis=1
    )

    # Clean NaN values
    df.fillna(0, inplace=True)
    
    # 2. KMeans Clustering
    df = apply_kmeans_clustering(df)
    
    # 3. Linear Regression
    df = apply_linear_regression(df)
    
    # 4. Logistic Regression
    df = apply_logistic_regression(df)
    
    # 5. Correlation Analysis
    # Select numeric columns only for correlation
    numeric_df = df.select_dtypes(include=['number'])
    # Avoid corr with IDs
    cols_to_drop = ['id', 'portfolio']
    numeric_df = numeric_df.drop(columns=[col for col in cols_to_drop if col in numeric_df.columns])
    
    try:
        corr_matrix = numeric_df.corr().fillna(0).to_dict()
    except Exception:
        corr_matrix = {}
        
    # Drop intermediate columns if we want, or keep them
    df.drop(columns=['discount_numeric', 'buy_label'], inplace=True, errors='ignore')

    # 6. Return Data
    # Replace NaN with None for valid JSON serialization
    df = df.where(pd.notnull(df), None)
    
    return {
        "stocks": df.to_dict(orient="records"),
        "correlation": corr_matrix
    }
