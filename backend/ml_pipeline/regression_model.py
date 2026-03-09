"""
regression_model.py
--------------------
Trains a LinearRegression model:
  Input  → Gold_Close price
  Output → Silver_Close price (predicted)

Steps:
- 80/20 train-test split
- Fit LinearRegression
- Evaluate R² and MSE
- Predict Silver price movement direction (UP / DOWN)
"""


import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error
import pandas as pd


def train_regression_model(merged_df: pd.DataFrame) -> dict:
    """
    Train a Linear Regression model to predict Silver price from Gold price.

    Args:
        merged_df: DataFrame with columns [Date, Gold_Close, Silver_Close]

    Returns:
        dict with keys:
          - model: trained LinearRegression object
          - r2: R² score on test set
          - mse: Mean Squared Error on test set
          - y_test: actual Silver test values
          - y_pred: predicted Silver test values
          - X_test: Gold test values
          - trend_prediction: "UP" or "DOWN"
          - last_gold_price: most recent Gold price used for prediction
          - predicted_silver_price: predicted Silver price for latest Gold
          - current_silver_price: actual latest Silver price
    """

    X = merged_df[["Gold_Close"]].values
    y = merged_df["Silver_Close"].values


    # 80/20 train-test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)


    # Train the model
    model = LinearRegression()
    model.fit(X_train, y_train)


    # Evaluate
    y_pred = model.predict(X_test)
    r2 = float(r2_score(y_test, y_pred))
    mse = float(mean_squared_error(y_test, y_pred))


    print(f"[Model] R² Score: {r2:.4f}")
    print(f"[Model] MSE: {mse:.4f}")


    # Predict next Silver price from the latest Gold price
    last_gold_price = float(merged_df["Gold_Close"].iloc[-1])
    predicted_silver_price = float(model.predict([[last_gold_price]])[0])
    current_silver_price = float(merged_df["Silver_Close"].iloc[-1])


    # Determine trend direction
    trend = "UP" if predicted_silver_price > current_silver_price else "DOWN"
    print(f"[Model] Trend Prediction: {trend} (Predicted Silver: {predicted_silver_price:.2f}, Current: {current_silver_price:.2f})")

    return {
        "model": model,
        "r2": round(r2, 4),
        "mse": round(mse, 4),
        "y_test": y_test.tolist(),
        "y_pred": y_pred.tolist(),
        "X_test": X_test.flatten().tolist(),
        "trend_prediction": trend,
        "last_gold_price": round(last_gold_price, 2),
        "predicted_silver_price": round(predicted_silver_price, 2),
        "current_silver_price": round(current_silver_price, 2),
    }
