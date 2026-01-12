from fastapi import APIRouter, Depends, HTTPException
from app.database import get_collection
from app.models.shop_owner_bank import BankDetailsInput
from app.utils.shop_owner_authenticate import owner_auth
from app.config import settings
from cryptography.fernet import Fernet
import base64
import hashlib
from datetime import datetime

router = APIRouter(prefix="/shop-owner/bank", tags=["Shop Owner Bank"])
bank_collection = get_collection("shop_bank_details")

# ---------------------------------------------------------
# HELPER: DERIVE KEY
# ---------------------------------------------------------
def get_cipher_suite():
    # Derive a 32-byte URL-safe base64 key from SECRET_KEY
    if not settings.SECRET_KEY:
        # Fallback for dev if secret key missing
        key_material = b"dev_secret_key_must_be_changed"
    else:
        key_material = settings.SECRET_KEY.encode()
        
    key = hashlib.sha256(key_material).digest()
    key_b64 = base64.urlsafe_b64encode(key)
    return Fernet(key_b64)

# ---------------------------------------------------------
# UPDATE BANK DETAILS (ENCRYPTED)
# ---------------------------------------------------------
@router.post("/update")
async def update_bank_details(payload: BankDetailsInput, owner=Depends(owner_auth)):
    owner_id = str(owner["_id"])
    cipher = get_cipher_suite()

    encrypted_account = cipher.encrypt(payload.account_number.encode())

    doc = {
        "owner_id": owner_id,
        "account_holder_name": payload.account_holder_name,
        "bank_name": payload.bank_name,
        "ifsc_code": payload.ifsc_code,
        "account_number_encrypted": encrypted_account,
        "updated_at": datetime.utcnow()
    }

    # Upsert
    await bank_collection.update_one(
        {"owner_id": owner_id},
        {"$set": doc},
        upsert=True
    )

    return {"message": "Bank details updated securely"}

# ---------------------------------------------------------
# GET BANK DETAILS (MASKED)
# ---------------------------------------------------------
@router.get("/")
async def get_bank_details(owner=Depends(owner_auth)):
    owner_id = str(owner["_id"])
    doc = await bank_collection.find_one({"owner_id": owner_id})

    if not doc:
        return {}

    # Decrypt to mask
    cipher = get_cipher_suite()
    try:
        decrypted = cipher.decrypt(doc["account_number_encrypted"]).decode()
        masked = "*" * (len(decrypted) - 4) + decrypted[-4:]
    except:
        masked = "****"

    return {
        "account_holder_name": doc["account_holder_name"],
        "bank_name": doc["bank_name"],
        "ifsc_code": doc["ifsc_code"],
        "account_number": masked, # Return masked only
        "updated_at": doc.get("updated_at")
    }
