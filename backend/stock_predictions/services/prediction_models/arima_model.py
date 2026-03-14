import numpy as np
import pandas as pd
from pmdarima import auto_arima

def train_arima_prediction(prices, steps=1):
    """
    Train auto_arima and forecast next N steps.
    """
    try:
        # Ensure prices are a pandas Series
        series = pd.Series(prices)
        if len(series) < 10:
            return float(series.iloc[-1])
            
        # Auto tune ARIMA parameters
        model = auto_arima(
            series, 
            seasonal=False, 
            stepwise=True, 
            suppress_warnings=True, 
            error_action="ignore", 
            max_p=5, max_q=5, d=1
        )
        
        forecast = model.predict(n_periods=steps)
        # Ensure we get a single float value
        val = forecast.iloc[-1] if hasattr(forecast, 'iloc') else forecast[-1]
        return float(np.asarray(val).item())
    except Exception as e:
        print(f"ARIMA Error: {e}")
        return float(prices[-1])
