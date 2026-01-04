from pydantic import BaseModel

class ShopBankCreate(BaseModel):
    account_holder: str
    account_number: str
    ifsc: str
    bank_name: str
    upi_id: str | None = None
