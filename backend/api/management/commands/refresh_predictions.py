"""
Management command: refresh_predictions

Precomputes ML predictions for all popular assets and stores them in
Django's cache (LocMemCache locally, Redis in production).

Usage
-----
    python manage.py refresh_predictions              # run once
    python manage.py refresh_predictions --all        # force-refresh even if cached

Schedule via cron (every 30 minutes):
    */30 * * * * /path/to/venv/bin/python /path/to/manage.py refresh_predictions

Or via APScheduler / Celery beat in production.
"""

import logging

from django.core.management.base import BaseCommand
from django.core.cache import cache

logger = logging.getLogger(__name__)


# ── Assets to precompute ───────────────────────────────────────────────────────
WARMUP_ASSETS = [
    # Indian large-caps
    ("TCS.NS",        "random_forest", "30d"),
    ("RELIANCE.NS",   "random_forest", "30d"),
    ("INFY.NS",       "random_forest", "30d"),
    ("HDFCBANK.NS",   "random_forest", "30d"),
    ("ICICIBANK.NS",  "random_forest", "30d"),
    ("WIPRO.NS",      "random_forest", "30d"),
    # Commodities & crypto
    ("GC=F",          "random_forest", "30d"),   # Gold (falls back to GLD)
    ("SI=F",          "random_forest", "30d"),   # Silver (falls back to SLV)
    ("BTC-USD",       "random_forest", "30d"),
    ("ETH-USD",       "random_forest", "30d"),
]


class Command(BaseCommand):
    help = "Precompute ML predictions and store them in Django cache (run every 30 min via cron)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--all",
            action="store_true",
            help="Force-refresh even if a valid cached prediction already exists",
        )

    def handle(self, *args, **options):
        force = options["all"]
        # Import here so Django is fully set up before analytics code loads
        from analytics.services.stock_prediction import predict_stock_price, HORIZON_CONFIG

        total = len(WARMUP_ASSETS)
        ok = 0
        failed = 0

        self.stdout.write(f"\n{'='*60}")
        self.stdout.write(f"  refresh_predictions  ({total} assets)")
        self.stdout.write(f"{'='*60}")

        for ticker, model, horizon in WARMUP_ASSETS:
            # Derive the cache key the same way predict_stock_price() does
            from analytics.services.stock_prediction import ASSET_META
            meta = ASSET_META.get(ticker.upper(), {"ticker": ticker})
            resolved = meta["ticker"]
            cache_key = f"pred_{resolved}_{model}_{horizon}"

            if not force and cache.get(cache_key) is not None:
                self.stdout.write(f"  ↷  {ticker:20s}  (already cached, skipping)")
                ok += 1
                continue

            try:
                result = predict_stock_price(ticker, model_type=model, horizon=horizon)
                if result.get("model") == "ERROR":
                    raise RuntimeError(result.get("error", "unknown"))
                self.stdout.write(
                    self.style.SUCCESS(f"  ✓  {ticker:20s}  {model:15s}  {horizon}")
                )
                ok += 1
            except Exception as exc:
                self.stdout.write(
                    self.style.ERROR(f"  ✗  {ticker:20s}  FAILED: {exc}")
                )
                logger.error("refresh_predictions failed for %s: %s", ticker, exc)
                failed += 1

        self.stdout.write(f"\n  Done  ✓ {ok}  ✗ {failed}\n")
