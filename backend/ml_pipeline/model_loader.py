import os
import joblib
import logging

logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

LSTM_MODEL = None
RNN_MODEL = None
RF_MODEL = None
LINEAR_MODEL = None

try:
    import tensorflow as tf
    if os.path.exists(os.path.join(MODELS_DIR, "lstm_model.h5")):
        LSTM_MODEL = tf.keras.models.load_model(os.path.join(MODELS_DIR, "lstm_model.h5"))
        logger.info("LSTM model loaded successfully.")
    
    if os.path.exists(os.path.join(MODELS_DIR, "rnn_model.h5")):
        RNN_MODEL = tf.keras.models.load_model(os.path.join(MODELS_DIR, "rnn_model.h5"))
        logger.info("RNN model loaded successfully.")
except ImportError:
    logger.warning("Tensorflow is not installed. LSTM/RNN true deep learning models skipped. Falling back to SKLearn in prediction services.")
except Exception as e:
    logger.warning(f"Error loading h5 models: {e}")

try:
    if os.path.exists(os.path.join(MODELS_DIR, "random_forest.pkl")):
        RF_MODEL = joblib.load(os.path.join(MODELS_DIR, "random_forest.pkl"))
        logger.info("Random Forest model loaded successfully.")
    
    if os.path.exists(os.path.join(MODELS_DIR, "linear_regression.pkl")):
        LINEAR_MODEL = joblib.load(os.path.join(MODELS_DIR, "linear_regression.pkl"))
        logger.info("Linear Regression model loaded successfully.")
except Exception as e:
    logger.warning(f"Error loading pkl models: {e}")
