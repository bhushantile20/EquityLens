from __future__ import annotations

import yfinance as yf


def _candidate_symbols(symbol: str) -> list[str]:
    symbol = str(symbol).strip().upper()
    candidates = [symbol]
    if "." not in symbol:
        candidates.append(f"{symbol}.NS")
    return candidates

def fetch_data(symbol: str, days: int = 365) -> list[dict]:
    """
    Return actual historical close prices from Yahoo Finance.
    """
    for ticker_symbol in _candidate_symbols(symbol):
        try:
            ticker = yf.Ticker(ticker_symbol)
            history = ticker.history(period="1y", interval="1d")
            if history.empty:
                continue
            closes = history["Close"].dropna()
            if closes.empty:
                continue

            rows = [
                {
                    "date": idx.strftime("%Y-%m-%d"),
                    "close": round(float(close), 2),
                }
                for idx, close in closes.items()
            ]
            if rows:
                return rows[-days:]
        except Exception:
            continue

    return []
