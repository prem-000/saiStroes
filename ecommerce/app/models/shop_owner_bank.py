from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class BankDetailsModel(BaseModel):
    owner_id: str
    account_holder_name: str
    bank_name: str
    account_number_encrypted: bytes  # Stored as bytes in DB (Binary) or base64 string
    ifsc_code: str
    updated_at: datetime = datetime.utcnow()

class BankDetailsInput(BaseModel):
    account_holder_name: str
    bank_name: str
    account_number: str
    ifsc_code: str
