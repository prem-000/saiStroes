from pydantic import BaseModel

class ShopProfileCreate(BaseModel):
    shop_name: str
    category: str
    phone: str
    address: str
    city: str
    pincode: str
    latitude: float
    longitude: float
