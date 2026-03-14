from django.apps import AppConfig


class ApiConfig(AppConfig):
    name = 'api'

    def ready(self):
        import os
        import threading
        
        # Avoid running pre-warm twice per start (e.g. Django auto-reload)
        if os.environ.get('RUN_MAIN', None) != 'true' and not os.environ.get('DJANGO_SETTINGS_MODULE', '').endswith('test'):
            def _pre_warm():
                try:
                    from ml_pipeline import model_loader
                    from analytics.services.stock_prediction import predict_stock_price
                    print("Pre-warming ML models and popular predictions (TCS, RELIANCE, INFY, HDFCBANK)...")
                    for ticker in ["TCS.NS", "RELIANCE.NS", "INFY.NS", "HDFCBANK.NS", "BTC-INR"]:
                        predict_stock_price(ticker, model_type="random_forest", horizon="30d")
                    print("Pre-warming complete!")
                except Exception as e:
                    print(f"Pre-warming disabled / failed: {e}")
                    
            t = threading.Thread(target=_pre_warm, daemon=True)
            t.start()
