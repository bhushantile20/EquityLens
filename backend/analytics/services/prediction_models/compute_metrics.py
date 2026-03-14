import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

def calculate_model_metrics(y_true, y_pred):
    """
    Calculate MAE, RMSE, MAPE, R², and Directional Accuracy.
    Returns a dictionary of metrics for professional display.
    """
    if len(y_true) == 0 or len(y_pred) == 0 or len(y_true) != len(y_pred):
        return {"mae": 0.0, "rmse": 0.0, "mape": 0.0, "r2": 0.0, "directional_accuracy": 0.0}
        
    y_true = np.array(y_true, dtype=float)
    y_pred = np.array(y_pred, dtype=float)
    
    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    
    # R² score — measure of how well the model explains variance
    try:
        r2 = r2_score(y_true, y_pred)
    except Exception:
        r2 = 0.0

    # MAPE — avoid division by zero
    non_zero = y_true != 0
    if np.any(non_zero):
        mape = np.mean(np.abs((y_true[non_zero] - y_pred[non_zero]) / y_true[non_zero])) * 100
    else:
        mape = 0.0

    # Directional Accuracy — % of times model correctly predicts up/down movement
    if len(y_true) > 1:
        true_direction = np.sign(np.diff(y_true))
        pred_direction = np.sign(np.diff(y_pred))
        directional_accuracy = np.mean(true_direction == pred_direction) * 100
    else:
        directional_accuracy = 0.0
        
    return {
        "mae": round(float(mae), 2),
        "rmse": round(float(rmse), 2),
        "mape": round(float(mape), 4),
        "r2": round(float(r2), 4),
        "directional_accuracy": round(float(directional_accuracy), 2),
    }
