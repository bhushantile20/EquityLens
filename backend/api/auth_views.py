from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.throttling import AnonRateThrottle
from django.contrib.auth.models import User
from .models import PasswordResetOTP
from .serializers import ForgotPasswordSerializer, VerifyOTPSerializer, ResetPasswordSerializer
from .telegram import send_telegram_message
from django.utils.crypto import get_random_string
import logging

logger = logging.getLogger(__name__)

class ForgotPasswordThrottle(AnonRateThrottle):
    def parse_rate(self, rate):
        return (3, 600)

class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ForgotPasswordThrottle]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = User.objects.filter(email=email).first()
            if not user:
                # To prevent email enumeration, return success even if user not found
                return Response({"message": "If an account with that email exists, an OTP has been sent via Telegram."}, status=status.HTTP_200_OK)

            otp = get_random_string(length=6, allowed_chars='0123456789')
            PasswordResetOTP.objects.create(user=user, otp=otp)
            
            message = f"Your Equity Lens OTP is: {otp} (valid for 5 minutes)"
            
            # Send to hardcoded chat_id 2028179776 for testing as requested
            test_chat_id = "2028179776"
            success = send_telegram_message(test_chat_id, message)

            if success:
                return Response({"message": "If an account with that email exists, an OTP has been sent via Telegram."}, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Failed to send OTP via Telegram."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            otp = serializer.validated_data['otp']

            user = User.objects.filter(email=email).first()
            if not user:
                return Response({"error": "Invalid OTP or email."}, status=status.HTTP_400_BAD_REQUEST)

            otp_record = PasswordResetOTP.objects.filter(user=user, otp=otp).order_by('-created_at').first()

            if not otp_record or not otp_record.is_valid():
                return Response({"error": "Invalid or expired OTP."}, status=status.HTTP_400_BAD_REQUEST)

            return Response({"message": "OTP verified successfully."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            otp = serializer.validated_data['otp']
            new_password = serializer.validated_data['new_password']

            user = User.objects.filter(email=email).first()
            if not user:
                return Response({"error": "Invalid request."}, status=status.HTTP_400_BAD_REQUEST)

            otp_record = PasswordResetOTP.objects.filter(user=user, otp=otp).order_by('-created_at').first()

            if not otp_record or not otp_record.is_valid():
                return Response({"error": "Invalid or expired OTP."}, status=status.HTTP_400_BAD_REQUEST)

            # Reset password and invalidate OTP
            user.set_password(new_password)
            user.save()

            otp_record.is_used = True
            otp_record.save()

            return Response({"message": "Password reset successfully."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
