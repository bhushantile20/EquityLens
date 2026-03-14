import pandas as pd
import numpy as np

def compute_pearson_correlation(df):
    """
    Compute Pearson correlation coefficient and provide interpretation.
    Uses gold_inr and silver_inr.
    """
    coefficient = float(df["gold_inr"].corr(df["silver_inr"]))
    
    if abs(coefficient) > 0.8:
        interpretation = "strong"
    elif abs(coefficient) > 0.5:
        interpretation = "moderate"
    else:
        interpretation = "weak"
        
    return {
        "coefficient": round(coefficient, 4),
        "interpretation": interpretation
    }

def compute_rolling_correlation(df, window=90):
    """
    Compute rolling correlation over a 90-day window.
    """
    rolling_corr = df["gold_inr"].rolling(window).corr(df["silver_inr"]).dropna()
    return rolling_corr
