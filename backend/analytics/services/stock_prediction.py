import logging
from .prediction_models import (
    linear_reg, 
    arima_model, 
    rnn_model, 
    cnn_model
)

logger = logging.getLogger(__name__)

def predict_stock_price(ticker: str, model_type: str = "linear_regression", horizon: str = "1_week"):
    """
    Factory function that routes the prediction request to the specified model implementation.
    """
    logger.info(f"Generating prediction for {ticker} using model: {model_type} for horizon {horizon}...")
    
    # Map horizon string to days
    horizon_map = {
        "1_week": 7,
        "1_month": 30,
        "3_months": 90,
        "6_months": 180,
        "9_months": 270,
        "12_months": 365
    }
    
    days_ahead = horizon_map.get(horizon, 7)
    
    model_map = {
        "linear_regression": linear_reg,
        "arima": arima_model,
        "rnn": rnn_model,
        "cnn": cnn_model
    }
    
    # Get the specific model service
    service = model_map.get(model_type.lower(), linear_reg)
    
    try:
        result = service.predict(ticker, days_ahead=days_ahead)
        result["model"] = model_type
        return result
    except Exception as e:
        logger.error(f"Prediction failed for {ticker} with model {model_type}: {e}")
        # Final fallback to linear regression if specific model fails
        if service != linear_reg:
            logger.info("Falling back to linear regression...")
            return linear_reg.predict(ticker, days_ahead=days_ahead)
        raise
