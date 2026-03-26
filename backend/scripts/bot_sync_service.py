import requests
import logging
from config import WEBAPP_SYNC_URL

logger = logging.getLogger(__name__)

def sync_to_webapp(history_data: dict) -> bool:
    """
    Sends history data to the Web App's sync endpoint.
    """
    if not WEBAPP_SYNC_URL:
        logger.warning("WEBAPP_SYNC_URL not configured. Skipping sync.")
        return False
        
    try:
        # Prepare payload matching BotSyncPayload schema
        payload = {
            "doctor_id": history_data.get('doctor_id', 1),
            "full_name": history_data.get('full_name'),
            "ci": str(history_data.get('ci')),
            "age": str(history_data.get('age')),
            "phone": str(history_data.get('phone')),
            "address": history_data.get('address', 'No especificada'),
            "occupation": history_data.get('occupation', 'No especificada'),
            "email": history_data.get('email'), # Bot might not have it yet, that's fine
            "preconsulta_answers": history_data
        }
        
        response = requests.post(
            WEBAPP_SYNC_URL,
            json=payload,
            timeout=10
        )
        
        if response.status_code == 200:
            logger.info(f"Successfully synced history for CI {payload['ci']} to Web App")
            return True
        else:
            logger.error(f"Failed to sync to Web App. Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        logger.error(f"Error during Web App sync: {str(e)}")
        return False
