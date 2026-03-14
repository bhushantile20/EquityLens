import numpy as np
from sklearn.preprocessing import MinMaxScaler
from sklearn.linear_model import LinearRegression

def train_lstm_prediction(prices, steps=1):
    """
    Improved prediction using rolling window and MinMaxScaler.
    Fallback implementation since LSTM (TensorFlow) is unavailable.
    """
    try:
        prices = np.array(prices).reshape(-1, 1)
        scaler = MinMaxScaler()
        scaled_prices = scaler.fit_transform(prices)
        
        # Create rolling window sequences
        lookback = 20
        if len(scaled_prices) <= lookback:
            return float(prices[-1])
            
        X, y = [], []
        for i in range(len(scaled_prices) - lookback):
            X.append(scaled_prices[i:i + lookback, 0])
            y.append(scaled_prices[i + lookback, 0])
            
        X, y = np.array(X), np.array(y)
        
        model = LinearRegression()
        model.fit(X, y)
        
        # Forecast steps ahead
        current_input = scaled_prices[-lookback:].reshape(1, -1)
        forecast_scaled = []
        
        for _ in range(steps):
            pred = model.predict(current_input)[0]
            forecast_scaled.append(pred)
            current_input = np.roll(current_input, -1)
            current_input[0, -1] = pred
            
        # Inverse transform the last prediction
        last_pred_scaled = np.array([[forecast_scaled[-1]]])
        prediction = scaler.inverse_transform(last_pred_scaled)
        
        return float(np.asarray(prediction).item())
    except Exception as e:
        print(f"LSTM Fallback Prediction Error: {e}")
        return float(prices[-1])
