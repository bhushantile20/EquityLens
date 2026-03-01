import yfinance as yf
import pandas as pd
import plotly.graph_objects as go
from datetime import datetime


# 1️⃣ Fetch stock data
def fetch_data(symbol):
    stock = yf.Ticker(symbol)
    df = stock.history(period="6mo")

    if df.empty:
        raise ValueError("No data found for this symbol.")

    return df


# 2️⃣ Calculate indicators
def calculate_indicators(df):

    # Moving averages
    df["MA30"] = df["Close"].rolling(window=30).mean()
    df["MA50"] = df["Close"].rolling(window=50).mean()

    # RSI
    delta = df["Close"].diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)

    avg_gain = gain.rolling(window=14).mean()
    avg_loss = loss.rolling(window=14).mean()

    rs = avg_gain / avg_loss
    df["RSI"] = 100 - (100 / (1 + rs))

    # Volatility
    df["Returns"] = df["Close"].pct_change()
    volatility = df["Returns"].std() * (252 ** 0.5)

    return df, volatility


# 3️⃣ Opportunity score
def calculate_opportunity(pe, rsi, price, ma50):

    score = 0

    if rsi and rsi < 35:
        score += 3

    if pe and pe < 25:
        score += 2

    if price < ma50:
        score += 2

    return min(score, 10)


# 4️⃣ Generate Plotly chart JSON
def generate_chart(df):

    fig = go.Figure()

    fig.add_trace(go.Candlestick(
        x=df.index,
        open=df["Open"],
        high=df["High"],
        low=df["Low"],
        close=df["Close"],
        name="Price"
    ))

    fig.add_trace(go.Scatter(
        x=df.index,
        y=df["MA30"],
        mode="lines",
        name="MA30"
    ))

    fig.add_trace(go.Scatter(
        x=df.index,
        y=df["MA50"],
        mode="lines",
        name="MA50"
    ))

    fig.update_layout(
        template="plotly_dark",
        xaxis_rangeslider_visible=False
    )

    return fig.to_json()