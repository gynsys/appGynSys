import sys
import os

# Set PYTHONPATH to include current dir so we can import app
sys.path.append(os.getcwd())

from scripts.test_firebase_direct import test_token_direct

if __name__ == "__main__":
    token = "dvcu7PMDSxGmdnuJmTOm_-:APA91bEQ5OrRZ91EtFNSWRi2_HWuBjHsmOGOcfyfBpep2q-AZeYTSr_1GiZHp_4w-MFamX8alr5-3yDgi7h5fs-AwfgHdzl5iE1sMcYBgYY1S7QnJQr4vO0"
    test_token_direct(token)
