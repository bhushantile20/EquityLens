import pandas as pd
import numpy as np

def compute_pearson_correlation(df):
    return float(df["Gold_Price"].corr(df["Silver_Price"]))

def compute_rolling_correlation(df, window=90):
    rolling_corr = df["Gold_Price"].rolling(window).corr(df["Silver_Price"]).dropna()
    return rolling_corr
