from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
import yfinance as yf
import decimal
from datetime import datetime

from .models import Prediction
from .serializers import PredictionSerializer
from .services.prediction_models.arima_model import train_arima_prediction
from .services.prediction_models.lstm_model import train_lstm_prediction
from .services.prediction_models.cnn_model import train_cnn_prediction

def normalize_symbol(symbol):
    """Normalize symbol to include .NS if not present, and try fallback to NASDAQ if NSE fails."""
    symbol = symbol.upper().strip()
    if "." not in symbol:
        return symbol + ".NS", symbol
    return symbol, symbol.split(".")[0]

class PredictionView(APIView):
    permission_classes = []

    def get(self, request):
        predictions = Prediction.objects.all()
        serializer = PredictionSerializer(predictions, many=True)
        return Response(serializer.data)

    def post(self, request):
        raw_symbol = request.data.get('symbol', '').upper().strip()
        target_time_str = request.data.get('target_time')

        if not raw_symbol or not target_time_str:
            return Response({'error': 'Symbol and target_time are required'}, status=status.HTTP_400_BAD_REQUEST)

        # Normalize symbol - Only allow .NS symbols for predictions
        if not raw_symbol.endswith('.NS'):
            return Response({'error': f'Only Indian stocks (NSE) are allowed. Please use a symbol ending with .NS (e.g. {raw_symbol}.NS)'}, status=status.HTTP_400_BAD_REQUEST)
        
        final_symbol = raw_symbol
        
        try:
            ticker = yf.Ticker(final_symbol)
            history = ticker.history(period="1y")

            if history.empty:
                return Response({'error': f'No data found for symbol {raw_symbol}. Did you mean {symbol_ns}?'}, status=status.HTTP_404_NOT_FOUND)

            # Calculate target steps
            now = timezone.now()
            target_time = datetime.fromisoformat(target_time_str.replace('Z', '+00:00'))
            if timezone.is_naive(target_time):
                target_time = timezone.make_aware(target_time)
            
            delta = target_time - now
            steps = max(1, int(delta.total_seconds() / 3600)) # Steps in hours

            prices = history['Close'].values
            
            # Get current price using fast_info or fallback
            try:
                current_price = float(ticker.fast_info.get("last_price", prices[-1]))
            except:
                current_price = float(prices[-1])

            # Min/Max for 30d window
            history_30d = history.last("30D") if not history.empty else history
            min_price_30d = float(history_30d['Low'].min())
            max_price_30d = float(history_30d['High'].max())

            # 2. Generate Predictions
            arima_pred = train_arima_prediction(prices, steps=steps)
            lstm_pred = train_lstm_prediction(prices, steps=steps)
            cnn_pred = train_cnn_prediction(prices, steps=steps)

            # Sanity filter: Clamp to +/- 15% change
            def clamp_prediction(pred, current):
                if abs(pred - current) / current > 0.15:
                    return current * (1.05 if pred > current else 0.95)
                return pred

            arima_pred = clamp_prediction(arima_pred, current_price)
            lstm_pred = clamp_prediction(lstm_pred, current_price)
            cnn_pred = clamp_prediction(cnn_pred, current_price)

            # 3. Create Prediction entry
            prediction = Prediction.objects.create(
                symbol=final_symbol,
                target_time=target_time,
                current_price=current_price,
                min_price_30d=min_price_30d,
                max_price_30d=max_price_30d,
                arima_prediction=arima_pred,
                lstm_prediction=lstm_pred,
                cnn_prediction=cnn_pred
            )

            serializer = PredictionSerializer(prediction)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class EvaluateView(APIView):
    permission_classes = []

    def post(self, request):
        now = timezone.now()
        pending = Prediction.objects.filter(target_time__lte=now, actual_price__isnull=True)
        
        updated_count = 0
        for pred in pending:
            try:
                ticker = yf.Ticker(pred.symbol)
                history = ticker.history(start=pred.target_time.date(), end=(pred.target_time + timezone.timedelta(days=1)).date())
                
                if not history.empty:
                    actual_price = history['Close'].iloc[0]
                    pred.actual_price = actual_price
                    
                    # Error = abs(predicted - actual)
                    pred.arima_error = abs(pred.arima_prediction - decimal.Decimal(str(actual_price)))
                    pred.lstm_error = abs(pred.lstm_prediction - decimal.Decimal(str(actual_price)))
                    pred.cnn_error = abs(pred.cnn_prediction - decimal.Decimal(str(actual_price)))
                    
                    pred.save()
                    updated_count += 1
            except Exception as e:
                print(f"Error evaluating {pred.symbol}: {e}")
        
        return Response({'updated': updated_count}, status=status.HTTP_200_OK)
