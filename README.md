# EquityLens 📈

EquityLens is an advanced AI-powered continuous learning analytical platform for financial markets (Stocks, Commodities, and Cryptocurrencies). It leverages machine learning models (ARIMA, LSTM, CNN, Random Forest) to provide asset price predictions, paired with real-time market data directly integrated with Yahoo Finance. It also features explainable AI (XAI) using SHAP and LIME to interpret deep learning and ensemble predictions.

---

## 📸 Project Screenshots

<details>
<summary>Click to view screenshots!</summary>

<img width="1919" height="984" alt="image" src="https://github.com/user-attachments/assets/47931104-fda9-4cce-a45e-8d07a93784e1" />
<img width="1909" height="983" alt="image" src="https://github.com/user-attachments/assets/98868201-52a0-4853-93cb-66c4a0e33861" />
<img width="1918" height="971" alt="image" src="https://github.com/user-attachments/assets/77516422-ee08-4c75-986a-42fbef1efa61" />
<img width="1919" height="975" alt="image" src="https://github.com/user-attachments/assets/cdeb1f49-3dbd-456c-a862-6c50555dc140" />
<img width="1918" height="985" alt="image" src="https://github.com/user-attachments/assets/7e5db890-4b41-45e8-918e-7a103802d115" />
<img width="1913" height="969" alt="image" src="https://github.com/user-attachments/assets/927db484-6027-47f7-82aa-abd3af4d73fd" />
<img width="1918" height="974" alt="image" src="https://github.com/user-attachments/assets/aa684dcd-a5a2-4b96-9e32-0940ec2f9ad9" />
<img width="1902" height="982" alt="image" src="https://github.com/user-attachments/assets/a57346bc-fcaa-45c6-889d-7f0f4487e655" />
<img width="1918" height="975" alt="image" src="https://github.com/user-attachments/assets/76e234ef-e687-422f-8b54-4dbe64aa695b" />
<img width="1894" height="971" alt="image" src="https://github.com/user-attachments/assets/0c07f779-fda6-48d4-8fe8-85a2cc531bc9" />
<img width="1915" height="980" alt="image" src="https://github.com/user-attachments/assets/a79a254e-9a93-4aed-ad74-a15797d1ebea" />
<img width="1919" height="984" alt="image" src="https://github.com/user-attachments/assets/c92c2e11-f3ea-4f1d-8266-56baf38fc31a" />
<img width="1914" height="983" alt="image" src="https://github.com/user-attachments/assets/b4c9dd24-d5f0-4c00-8124-add5f5a4ed4c" />

</details>

*(You can add more screenshots just by dropping them in the above section)*

---

## 🚀 Key Features

* **Multi-Asset Forecasting:** Real-time and forward-looking predictions for Indian Equities (NSE), Gold, Silver, and Cryptocurrencies (BTC, ETH).
* **Advanced ML Pipeline:** Multiple prediction algorithms including Random Forest, ARIMA, LSTM, and simulated CNN/RNN.
* **Explainable AI (XAI):** Full transparency into what drives predictions using SHAP (feature importance) and LIME (local surrogate models).
* **NIFTY 50 Clustering:** Principal Component Analysis (PCA) and K-Means clustering for grouping large-cap Indian stocks by market behavior.
* **Robust Market Data:** Automatic multi-layer fallback strategy for `yfinance` to bypass cloud-provider IP rate limits.
* **Continuous Background Caching:** Prediction models pre-warm via cron schedules using Redis/LocMem, making frontend API hits lightning fast.

---

## 🛠 Tech Stack

**Frontend:**
* React (Vite)
* Tailwind CSS
* Recharts / Chart.js for visualization
* Axios for API integration

**Backend:**
* Python (Django 5.0+, Django REST Framework)
* Machine Learning: `scikit-learn`, `tensorflow`, `statsmodels`
* Market Data: `yfinance`, `pandas`, `numpy`
* Explainability: `shap`, `lime`

**Infrastructure & Deployment:**
* Gunicorn & Nginx
* Redis (Caching)
* PM2 (Process Manager)
* Azure Virtual Machines (Ubuntu)
* GitHub Actions (CI/CD Automated Deployment)

---

## 📐 System Architecture & Sequence Diagram

The following sequence diagram illustrates the flow of data from the user requesting a prediction to the AI models serving cached or live generated data.

```mermaid
sequenceDiagram
    participant User as User (React Frontend)
    participant Nginx as Nginx (Reverse Proxy)
    participant API as Django REST API
    participant Cache as Redis/LocMem Cache
    participant YF as Yahoo Finance API
    participant ML as Machine Learning Pipeline
    
    User->>Nginx: GET /api/predict/?asset=RELIANCE.NS
    Nginx->>API: Forward Request
    
    API->>Cache: Check for pre-warmed prediction
    alt Cache Hit
        Cache-->>API: Return cached JSON prediction
        API-->>Nginx: HTTP 200 OK
        Nginx-->>User: Display Chart & Metrics
    else Cache Miss / Stale
        API->>YF: Fetch historical OHLC data
        alt Data Fetch Fails
            YF-->>API: rate-limited / error
            API->>YF: Fallback to Ticker.history() or ETF proxy
        end
        YF-->>API: Return historical DataFrame
        
        API->>ML: Pass DataFrame for Training & Prediction
        ML-->>API: Return Forecast Values + Metrics (RMSE, MAE)
        
        API->>Cache: Save new prediction (valid for 30m)
        API-->>Nginx: HTTP 200 OK (Fresh Data)
        Nginx-->>User: Display Chart & Metrics
    end
```

---

## ⚙️ Local Setup and Installation

### 1. Clone the repository
```bash
git clone https://github.com/bhushantile20/EquityLens.git
cd EquityLens
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Or `venv\Scripts\activate` on Windows
pip install -r requirements.txt

# Setup Database and Demo Data
python manage.py makemigrations
python manage.py migrate
python manage.py create_demo_user

# Run server
python manage.py runserver
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Set up local environment variables
echo "VITE_API_BASE_URL=http://localhost:8000/api/" > .env

# Run development server
npm run dev
```

---

## 🌍 Production Deployment workflow

This project utilizes purely automated CI/CD deployments through GitHub Actions perfectly suited for Azure.

When code is pushed to the `main` branch:
1. **GitHub Actions** checks out the repository.
2. Code is securely teleported to the **Azure Server** via SSH/SCP.
3. A remote script is triggered that:
   * Rebuilds the Vite React dashboard for production.
   * Updates Python dependencies and runs `manage.py migrate`.
   * Auto-restarts the `PM2` Django process and `Nginx` reverse proxy.

*For detailed local-to-server configurations, please ensure CORS, CSRF, and Allowed Hosts are populated in your `.env` correctly.*
