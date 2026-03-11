from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from gold_silver_analysis.services.feature_engineering import get_features_list
import pandas as pd

def train_silver_model(df):
    features = get_features_list()
    X = df[features]
    y = df["Silver_Price"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)
    
    model = RandomForestRegressor(n_estimators=50, random_state=42)
    model.fit(X_train, y_train)
    return model, X_train, X_test

def predict_silver_future(model, features_df):
    return float(model.predict(features_df)[0])
