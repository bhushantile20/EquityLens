import pandas as pd
from sklearn.linear_model import LinearRegression

def apply_linear_regression(df: pd.DataFrame) -> pd.DataFrame:
    """
    Applies Linear Regression to predict 'current_price'.
    Features: pe_ratio, price_range, volatility_ratio, cluster.
    Adds 'predicted_price' and 'expected_return' to DataFrame column in-place.
    """
    if len(df) < 3:
        # Not enough data for reliable regression, fallback to zero return
        df['predicted_price'] = df['current_price']
        df['expected_return'] = 0.0
        return df

    features = ['pe_ratio', 'price_range', 'volatility_ratio', 'cluster']
    
    X = df[features].copy()
    y = df['current_price'].copy()
    
    # Fill missing values
    X.fillna(X.median(), inplace=True)
    X.fillna(0, inplace=True)
    y.fillna(y.median(), inplace=True)
    
    model = LinearRegression()
    try:
        model.fit(X, y)
        df['predicted_price'] = model.predict(X)
    except Exception:
        df['predicted_price'] = df['current_price']
        
    # Calculate Expected Return (%)
    # Handle zero division safety
    df['expected_return'] = df.apply(
        lambda row: ((row['predicted_price'] - row['current_price']) / row['current_price'] * 100) 
        if row['current_price'] and row['current_price'] > 0 else 0.0,
        axis=1
    )
    
    return df
