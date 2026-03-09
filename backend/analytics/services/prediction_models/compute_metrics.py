import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error

def calculate_model_metrics(y_true, y_pred):
    """
    Calculate MAE, RMSE, and MAPE between true and predicted values.
    Returns a dictionary of metrics.
    """
    if len(y_true) == 0 or len(y_pred) == 0 or len(y_true) != len(y_pred):
        return {"mae": 0.0, "rmse": 0.0, "mape": 0.0}
        
    y_true = np.array(y_true)
    y_pred = np.array(y_pred)
    
    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    
    # Avoid division by zero
    non_zero = y_true != 0
    if np.any(non_zero):
        mape = np.mean(np.abs((y_true[non_zero] - y_pred[non_zero]) / y_true[non_zero])) * 100
    else:
        mape = 0.0
        
    return {
        "mae": round(float(mae), 2),
        "rmse": round(float(rmse), 2),
        "mape": round(float(mape), 2)
    }
