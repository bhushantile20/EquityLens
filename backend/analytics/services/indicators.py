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
        return {"pe_ratio": 0.0, "discount_level": "UNKNOWN"}

    current_price = float(df[-1]["close"])
    average_price = sum(float(row["close"]) for row in df) / len(df)
    pe_ratio = _live_pe(symbol)
    if pe_ratio is None:
        pe_ratio = round(current_price / max(average_price, 1.0), 2)

    ratio = current_price / max(average_price, 1.0)
    if ratio <= 0.9:
        discount_level = "HIGH"
    elif ratio <= 1.0:
        discount_level = "MEDIUM"
    else:
        discount_level = "LOW"

    return {"pe_ratio": pe_ratio, "discount_level": discount_level}
