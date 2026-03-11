from __future__ import annotations

import yfinance as yf


def _candidate_symbols(symbol: str) -> list[str]:
    symbol = str(symbol).strip().upper()
    candidates = [symbol]
    if "." not in symbol:
        candidates.append(f"{symbol}.NS")
    return candidates



def _live_pe(symbol: str) -> float | None:
    for ticker_symbol in _candidate_symbols(symbol):
        try:
            info = yf.Ticker(ticker_symbol).info or {}
            pe_ratio = info.get("trailingPE") or info.get("forwardPE")
            if pe_ratio is not None:
                return round(float(pe_ratio), 2)

            price = info.get("regularMarketPrice")
            eps = info.get("trailingEps")
            if price and eps and float(eps) != 0:
                return round(float(price) / float(eps), 2)
        except Exception:
            continue
    return None
def indicators(df: list[dict], symbol: str) -> dict:
    """
    Compute PE ratio and discount level from actual market data.
    """
    if not df:
        return {
            "pe_ratio": 0.0, 
            "discount_level": "UNKNOWN", 
            "discount_percent": 0.0, 
            "one_year_high": 0.0
        }

    current_price = float(df[-1]["close"])
    average_price = sum(float(row["close"]) for row in df) / len(df)
    pe_ratio = _live_pe(symbol)
    if pe_ratio is None:
        pe_ratio = round(current_price / max(average_price, 1.0), 2)

    one_year_high = max(float(row.get("high", row["close"])) for row in df)
    discount_percent = 0.0
    if one_year_high > 0:
        discount_percent = ((one_year_high - current_price) / one_year_high) * 100
    
    discount_percent = round(discount_percent, 2)

    if discount_percent > 30:
        discount_level = "VERY HIGH"
    elif discount_percent > 20:
        discount_level = "HIGH"
    elif discount_percent > 10:
        discount_level = "MEDIUM"
    else:
        discount_level = "LOW"

    return {
        "pe_ratio": pe_ratio, 
        "discount_level": discount_level,
        "discount_percent": discount_percent,
        "one_year_high": round(one_year_high, 2)
    }
