import os
import tempfile
import logging

logger = logging.getLogger(__name__)

from django.apps import AppConfig


class ApiConfig(AppConfig):
    name = 'api'

    def ready(self):
        import threading

        # ── Suppress TensorFlow CUDA noise (no GPU on Azure VM – expected) ──
        os.environ.setdefault('TF_CPP_MIN_LOG_LEVEL', '3')
        os.environ.setdefault('TF_ENABLE_ONEDNN_OPTS', '0')

        # ── Use a temp-dir lock file that works on both Windows and Linux ──
        lock_file = os.path.join(tempfile.gettempdir(), 'equitylens_prewarm.lock')

        # Skip if another worker already claimed the lock
        if os.path.exists(lock_file):
            return

        # Try to create the lock file atomically
        try:
            fd = os.open(lock_file, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            os.close(fd)
        except FileExistsError:
            return  # Another process just created it

        def _pre_warm():
            try:
                from analytics.services.stock_prediction import predict_stock_price
                logger.info("Pre-warming ML models (TCS, RELIANCE, INFY, HDFCBANK)…")
                # BTC-USD works on cloud IPs; stock_prediction.py handles INR conversion
                for ticker in ["TCS.NS", "RELIANCE.NS", "INFY.NS", "HDFCBANK.NS", "BTC-USD"]:
                    try:
                        predict_stock_price(ticker, model_type="random_forest", horizon="30d")
                        logger.info(f"  ✓ Pre-warmed {ticker}")
                    except Exception as e:
                        logger.warning(f"  ✗ Could not pre-warm {ticker}: {e}")
                logger.info("Pre-warming complete!")
            except Exception as e:
                logger.warning(f"Pre-warming disabled / failed: {e}")
            finally:
                # Remove lock so it can run again after a full server restart
                try:
                    os.remove(lock_file)
                except OSError:
                    pass

        t = threading.Thread(target=_pre_warm, daemon=True)
        t.start()
