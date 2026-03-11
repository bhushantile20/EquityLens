import pandas as pd

def get_features_list():
    return [
        "GLD_Lag_1", "GLD_Lag_2", 
        "SLV_Lag_1", "SLV_Lag_2", 
        "Gold_Silver_Ratio", "TimeIndex"
    ]

def apply_feature_engineering(df):
    df = df.copy()
    
    df["GLD_Lag_1"] = df["Gold_Price"].shift(1)
    df["GLD_Lag_2"] = df["Gold_Price"].shift(2)
    df["SLV_Lag_1"] = df["Silver_Price"].shift(1)
    df["SLV_Lag_2"] = df["Silver_Price"].shift(2)
    df["Gold_Silver_Ratio"] = df["Gold_Price"] / df["Silver_Price"]
    df["TimeIndex"] = range(len(df))
    
    df = df.dropna()
    return df
