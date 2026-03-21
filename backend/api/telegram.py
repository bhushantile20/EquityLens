import requests
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def send_telegram_message(chat_id: str, message: str) -> bool:
    """
    Sends a telegram message using the bot token defined in settings.
    """
    bot_token = getattr(settings, 'TELEGRAM_BOT_TOKEN', None)
    if not bot_token:
        logger.error("TELEGRAM_BOT_TOKEN is not set in settings.")
        return False
        
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message
    }
    try:
        response = requests.post(url, json=payload, timeout=5)
        response.raise_for_status()
        return True
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to send Telegram message to {chat_id}. Error: {e}")
        return False
