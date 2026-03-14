from django.db import models

class Prediction(models.Model):
    symbol = models.CharField(max_length=20)
    target_time = models.DateTimeField()
    current_price = models.DecimalField(max_digits=15, decimal_places=2)
    min_price_30d = models.DecimalField(max_digits=15, decimal_places=2)
    max_price_30d = models.DecimalField(max_digits=15, decimal_places=2)
    
    arima_prediction = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    lstm_prediction = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    cnn_prediction = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    
    actual_price = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    arima_error = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    lstm_error = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    cnn_error = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.symbol} - {self.target_time}"
