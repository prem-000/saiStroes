from pydantic import BaseModel
from typing import Optional


class DeliveryAddress(BaseModel):
    name: str
    phone: str
    address_line: str
    city: str
    pincode: str
    state: str
    lat: float
    lng: float


class CheckoutCreateOrder(BaseModel):
    payment_method: str   # "cod" | "online"
    delivery_address: DeliveryAddress
    note: Optional[str] = None
    claim_new_user: bool = False
