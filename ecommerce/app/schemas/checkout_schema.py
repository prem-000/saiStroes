from pydantic import BaseModel

class DeliveryAddress(BaseModel):
    name: str
    phone: str
    address_line: str
    city: str
    pincode: str
    state: str

class CheckoutCreateOrder(BaseModel):
    note: str | None = None
    delivery_address: DeliveryAddress
