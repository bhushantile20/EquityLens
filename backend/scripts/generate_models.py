import os
import numpy as np
import joblib
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, SimpleRNN

# Create models directory
os.makedirs('models', exist_ok=True)

# Dummy dataset
X = np.random.rand(100, 10, 1)
y = np.random.rand(100)
X_flat = X.reshape(100, -1)

# LSTM
lstm = Sequential([
    LSTM(50, return_sequences=True, input_shape=(10, 1)),
    Dropout(0.2),
    LSTM(50),
    Dropout(0.2),
    Dense(1)
])
lstm.compile(optimizer='adam', loss='mse')
lstm.fit(X, y, epochs=1, verbose=0)
lstm.save('models/lstm_model.h5')

# RNN
rnn = Sequential([
    SimpleRNN(50, return_sequences=True, input_shape=(10, 1)),
    Dropout(0.2),
    SimpleRNN(50),
    Dropout(0.2),
    Dense(1)
])
rnn.compile(optimizer='adam', loss='mse')
rnn.fit(X, y, epochs=1, verbose=0)
rnn.save('models/rnn_model.h5')

# Random Forest
rf = RandomForestRegressor(n_estimators=100, random_state=42)
rf.fit(X_flat, y)
joblib.dump(rf, 'models/random_forest.pkl')

# Linear Regression
lr = LinearRegression()
lr.fit(X_flat, y)
joblib.dump(lr, 'models/linear_regression.pkl')

print("Models generated successfully!")
