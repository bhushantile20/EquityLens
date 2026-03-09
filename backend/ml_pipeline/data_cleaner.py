"""
data_cleaner.py
---------------
Cleans raw Gold and Silver DataFrames:
- Drops NaN rows
- Keeps only Date and Close columns
- Renames to Gold_Close / Silver_Close
- Merges on Date into a single combined DataFrame
"""

import pandas as pd


def clean_commodity_df(df: pd.DataFrame, label: str) -> pd.DataFrame:
    """
    Clean a single commodity DataFrame:
    - Remove NaN rows
    - Reset index
    - Keep only Date and Close
    - Rename Close to {label}_Close

    Args:
        df: Raw DataFrame from yfinance
        label: Column name prefix (e.g. 'Gold' or 'Silver')

    Returns:
        Cleaned DataFrame with columns: [Date, {label}_Close]
    """
    df = df[["Date", "Close"]].copy()
    df = df.dropna().reset_index(drop=True)
    df["Date"] = pd.to_datetime(df["Date"]).dt.normalize()
    df.rename(columns={"Close": f"{label}_Close"}, inplace=True)
    return df


def merge_gold_silver(gold_df: pd.DataFrame, silver_df: pd.DataFrame) -> pd.DataFrame:
    """
    Merge cleaned Gold and Silver DataFrames on Date (inner join).

    Args:
        gold_df: Cleaned Gold DataFrame with Gold_Close column
        silver_df: Cleaned Silver DataFrame with Silver_Close column

    Returns:
        Merged DataFrame with columns: [Date, Gold_Close, Silver_Close]
    """
    merged = pd.merge(gold_df, silver_df, on="Date", how="inner")
    merged = merged.sort_values("Date").reset_index(drop=True)
    print(f"[Cleaner] Merged dataset: {len(merged)} rows from {merged['Date'].min().date()} to {merged['Date'].max().date()}")
    return merged
