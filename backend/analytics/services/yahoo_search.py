from __future__ import annotations

from typing import Any
from datetime import datetime, timezone
from math import sqrt

import yfinance as yf

from analytics.services.opportunity_engine import opportunity_engine


ALLOWED_PERIODS = {"1mo", "3mo", "6mo", "1y", "2y", "3y", "5y", "10y", "max"}
ALLOWED_INTERVALS = {"1d", "1wk", "1mo"}


def _discount_level(min_price: float, max_price: float, current_price: float) -> str:
    if max_price <= min_price:
        return "MEDIUM"
    price_position = (current_price - min_price) / (max_price - min_price)
    if price_position <= 0.33:
        return "HIGH"
    if price_position <= 0.66:
        return "MEDIUM"
    return "LOW"


def _normalize_period(period: str | None) -> str:
    value = (period or "1y").strip().lower()
    return value if value in ALLOWED_PERIODS else "1y"


def _normalize_interval(interval: str | None) -> str:
    value = (interval or "1d").strip().lower()
    return value if value in ALLOWED_INTERVALS else "1d"


def _infer_currency(symbol: str, reported_currency: str | None = None) -> str:
    # All NSE stocks are priced in INR
    return "INR"


def _to_nse(symbol: str) -> str:
    """Ensure the symbol has the .NS suffix for NSE India."""
    s = symbol.strip().upper()
    if not s.endswith(".NS"):
        s = s + ".NS"
    return s


def _is_nse(symbol: str) -> bool:
    """Return True only if the symbol is an NSE (.NS) ticker."""
    return str(symbol).upper().endswith(".NS")


def _extract_prices(history):
    if "Adj Close" in history.columns:
        series = history["Adj Close"].dropna()
        if not series.empty:
            return series
    if "Close" in history.columns:
        return history["Close"].dropna()
    return history.iloc[:, 0].dropna()


def _compute_regression(points: list[dict[str, float]]) -> dict[str, float]:
    n = len(points)
    if n < 2:
        return {"slope": 0.0, "intercept": 0.0, "correlation": 0.0}

    sum_x = sum(point["x"] for point in points)
    sum_y = sum(point["y"] for point in points)
    sum_xy = sum(point["x"] * point["y"] for point in points)
    sum_x2 = sum(point["x"] * point["x"] for point in points)
    sum_y2 = sum(point["y"] * point["y"] for point in points)

    denominator = (n * sum_x2) - (sum_x * sum_x)
    slope = 0.0 if denominator == 0 else ((n * sum_xy) - (sum_x * sum_y)) / denominator
    intercept = (sum_y - (slope * sum_x)) / n

    corr_numerator = (n * sum_xy) - (sum_x * sum_y)
    corr_denominator = sqrt(((n * sum_x2) - (sum_x * sum_x)) * ((n * sum_y2) - (sum_y * sum_y)))
    correlation = 0.0 if corr_denominator == 0 else corr_numerator / corr_denominator

    return {"slope": slope, "intercept": intercept, "correlation": correlation}


def _fetch_ticker_payload(symbol: str, period: str, interval: str) -> dict[str, Any]:
    ticker = yf.Ticker(symbol)
    history = ticker.history(period=period, interval=interval)
    if history.empty:
        raise ValueError(f"No data found for ticker: {symbol}")

    closes = _extract_prices(history)
    if closes.empty:
        raise ValueError(f"No price data available for ticker: {symbol}")

    dates = [idx.strftime("%Y-%m-%d") for idx in closes.index]
    prices = [round(float(value), 4) for value in closes.tolist()]
    current_price = prices[-1]
    min_price = min(prices)
    max_price = max(prices)
    moving_avg = [
        round(float(closes.iloc[max(0, i - 4): i + 1].mean()), 4)
        for i in range(len(closes))
    ]

    info = {}
    try:
        info = ticker.info or {}
    except Exception:
        info = {}

    pe_ratio = info.get("trailingPE") or info.get("forwardPE")
    company_name = info.get("shortName") or info.get("longName") or symbol
    currency = _infer_currency(symbol, info.get("currency"))

    return {
        "symbol": symbol,
        "company_name": company_name,
        "currency": currency,
        "pe_ratio": round(float(pe_ratio), 2) if pe_ratio is not None else None,
        "current_price": round(current_price, 2),
        "min_price": round(min_price, 2),
        "max_price": round(max_price, 2),
        "today_price": round(current_price, 2),
        "dates": dates,
        "prices": prices,
        "moving_avg": moving_avg,
        "price_map": {dates[index]: prices[index] for index in range(len(dates))},
    }


def search_live_stocks(query: str, limit: int = 10) -> list[dict[str, Any]]:
    """
    Search NSE (India) stocks from Yahoo Finance.
    Only returns tickers ending with .NS (National Stock Exchange).
    """
    if not query.strip():
        return []

    # Build candidate list — NSE symbols only
    candidates: list[dict[str, str]] = []
    try:
        search = yf.Search(query, max_results=limit * 5)  # fetch more to allow NSE filtering
        quotes = getattr(search, "quotes", []) or []
        for quote in quotes:
            symbol = quote.get("symbol", "")
            if not symbol:
                continue
            # Only allow NSE India stocks
            if not _is_nse(symbol):
                continue
            quote_type = quote.get("quoteType")
            if quote_type and str(quote_type).upper() != "EQUITY":
                continue
            company_name = (
                quote.get("shortname")
                or quote.get("longname")
                or quote.get("displayName")
                or symbol
            )
            candidates.append({"symbol": symbol, "company_name": company_name})
            if len(candidates) >= limit:
                break
    except Exception:
        candidates = []

    # Fallback: try the query itself with .NS appended
    if not candidates:
        candidates = [{"symbol": _to_nse(query), "company_name": query.upper()}]

    results: list[dict[str, Any]] = []
    for candidate in candidates[:limit]:
        symbol = candidate["symbol"]  # guaranteed .NS at this point
        try:
            ticker = yf.Ticker(symbol)
            history = ticker.history(period="1y", interval="1d")
            if history.empty:
                continue

            closes = history["Close"].dropna()
            if closes.empty:
                continue

            min_price = round(float(closes.min()), 2)
            max_price = round(float(closes.max()), 2)
            closing_price = round(float(closes.iloc[-1]), 2)

            pe_ratio = None
            company_name = candidate["company_name"]
            try:
                info = ticker.info or {}
                pe_ratio = info.get("trailingPE") or info.get("forwardPE")
                company_name = info.get("shortName") or info.get("longName") or company_name
            except Exception:
                pass

            pe_ratio_value = round(float(pe_ratio), 2) if pe_ratio is not None else None
            results.append(
                {
                    "id": None,
                    "symbol": symbol,
                    "company_name": company_name,
                    "current_price": closing_price,
                    "min_price": min_price,
                    "max_price": max_price,
                    "closing_price": closing_price,
                    "pe_ratio": pe_ratio_value,
                    "currency": "INR",
                    "discount_level": _discount_level(
                        min_price=min_price,
                        max_price=max_price,
                        current_price=closing_price,
                    ),
                    "is_live": True,
                }
            )
        except Exception:
            continue

    return results


def fetch_live_stock_detail(
    symbol: str,
    period: str = "1y",
    interval: str = "1d",
) -> dict[str, Any] | None:
    """
    Fetch NSE India stock detail from Yahoo Finance.
    Automatically appends .NS suffix if not present.
    """
    ticker_symbol = _to_nse(symbol)  # enforce NSE suffix
    normalized_period   = _normalize_period(period)
    normalized_interval = _normalize_interval(interval)

    try:
        payload = _fetch_ticker_payload(
            symbol=ticker_symbol,
            period=normalized_period,
            interval=normalized_interval,
        )
        prices        = payload["prices"]
        current_price = payload["current_price"]
        min_price     = payload["min_price"]
        max_price     = payload["max_price"]
        discount_level = _discount_level(min_price=min_price, max_price=max_price, current_price=current_price)
        pe_ratio       = payload["pe_ratio"]
        pe_value       = pe_ratio if pe_ratio is not None else 0.0
        opportunity_score = opportunity_engine(pe_ratio=pe_value, discount_level=discount_level)

        return {
            "id":             None,
            "portfolio":      None,
            "portfolio_name": "NSE India",
            "symbol":         ticker_symbol,
            "company_name":   payload["company_name"],
            "sector":         "NSE India",
            "currency":       "INR",
            "current_price":  current_price,
            "min_price":      round(min_price, 2),
            "max_price":      round(max_price, 2),
            "today_price":    round(current_price, 2),
            "is_live":        True,
            "analytics": {
                "pe_ratio":         pe_ratio,
                "discount_level":   discount_level,
                "opportunity_score": opportunity_score,
                "graph_data": {
                    "dates":      payload["dates"],
                    "price":      prices,
                    "moving_avg": payload["moving_avg"],
                    "period":     normalized_period,
                    "interval":   normalized_interval,
                },
                "last_updated": datetime.now(timezone.utc).isoformat(),
            },
        }
    except Exception:
        return None


def fetch_live_stock_comparison(
    symbol_a: str,
    symbol_b: str,
    period: str = "5y",
    interval: str = "1d",
) -> dict[str, Any]:
    # Enforce NSE suffix on both symbols
    ticker_a = _to_nse(symbol_a)
    ticker_b = _to_nse(symbol_b)
    if ticker_a == ticker_b:
        raise ValueError("Please select two different NSE stocks.")

    normalized_period = _normalize_period(period or "5y")
    normalized_interval = _normalize_interval(interval)

    try:
        stock_a = _fetch_ticker_payload(ticker_a, normalized_period, normalized_interval)
        stock_b = _fetch_ticker_payload(ticker_b, normalized_period, normalized_interval)
    except ValueError:
        raise
    except Exception as exc:
        raise RuntimeError("Unable to fetch stock data from Yahoo Finance.") from exc

    aligned_dates = sorted(set(stock_a["price_map"].keys()).intersection(stock_b["price_map"].keys()))
    historical = []
    for date in aligned_dates:
        price_a = stock_a["price_map"].get(date)
        price_b = stock_b["price_map"].get(date)
        if price_a is None or price_b is None:
            continue
        historical.append(
            {
                "date": date,
                "price_a": round(float(price_a), 4),
                "price_b": round(float(price_b), 4),
            }
        )

    if len(historical) < 2:
        raise ValueError("Not enough overlapping data to compare selected stocks.")

    points = [{"x": row["price_a"], "y": row["price_b"], "date": row["date"]} for row in historical]
    regression = _compute_regression(points)
    scatter = [
        {
            "date": point["date"],
            "x": point["x"],
            "y": point["y"],
            "y_fit": round((regression["slope"] * point["x"]) + regression["intercept"], 6),
        }
        for point in sorted(points, key=lambda item: item["x"])
    ]

    slope = regression["slope"]
    intercept = regression["intercept"]
    equation = f"{ticker_b} = {slope:.6f} * {ticker_a} + {intercept:.6f}"

    return {
        "period": normalized_period,
        "interval": normalized_interval,
        "stock_a": {
            "symbol": stock_a["symbol"],
            "company_name": stock_a["company_name"],
            "currency": stock_a["currency"],
            "current_price": stock_a["current_price"],
            "min_price": stock_a["min_price"],
            "max_price": stock_a["max_price"],
            "today_price": stock_a["today_price"],
            "pe_ratio": stock_a["pe_ratio"],
        },
        "stock_b": {
            "symbol": stock_b["symbol"],
            "company_name": stock_b["company_name"],
            "currency": stock_b["currency"],
            "current_price": stock_b["current_price"],
            "min_price": stock_b["min_price"],
            "max_price": stock_b["max_price"],
            "today_price": stock_b["today_price"],
            "pe_ratio": stock_b["pe_ratio"],
        },
        "historical": historical,
        "scatter": scatter,
        "pearson_correlation": round(regression["correlation"], 6),
        "regression": {
            "slope": round(slope, 6),
            "intercept": round(intercept, 6),
            "equation": equation,
        },
    }
