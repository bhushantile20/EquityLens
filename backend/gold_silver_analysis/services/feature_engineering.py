import pandas as pd

def get_features_list():
    """Returns the list of features used for training."""
    return [
        "lag_1", "lag_5", "lag_10", 
        "momentum_5", "volatility_10", 
        "ratio", "time_index"
    ]

def apply_feature_engineering(df, target_col="Gold_Price"):
    """
    Creates features: Lag 1, 5, 10 days, Momentum, Volatility, Ratio, and Time Index.
    """
    df = df.copy()
    
    # Common features
    df["ratio"] = df["Gold_Price"] / df["Silver_Price"]
    df["time_index"] = range(len(df))
    
    # Target specific features (Lags, Momentum, Volatility)
    df["lag_1"] = df[target_col].shift(1)
    df["lag_5"] = df[target_col].shift(5)
    df["lag_10"] = df[target_col].shift(10)
    
    df["momentum_5"] = df[target_col] - df[target_col].shift(5)
    df["volatility_10"] = df[target_col].rolling(10).std()
    
    # Target for prediction: Next day price
    df["target"] = df[target_col].shift(-1)
    
    df = df.dropna()
    return df
