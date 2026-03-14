from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from gold_silver_analysis.services.feature_engineering import get_features_list
import pandas as pd

def train_gold_model(df):
    """
    Trains a LinearRegression model for Gold price prediction.
    Target is next day's price.
    """
    features = get_features_list()
    X = df[features]
    y = df["target"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)
    
    model = LinearRegression()
    model.fit(X_train, y_train)
    return model, X_train, X_test

def predict_gold_future(model, features_df):
    """Predicts next day price."""
    return float(model.predict(features_df)[0])
