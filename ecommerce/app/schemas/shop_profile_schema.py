from pydantic import BaseModel

class Location(BaseModel):
    lat: float
    lng: float

class ShopProfileCreate(BaseModel):
    shop_name: str
    category: str
    phone: str
    address: str
    city: str
    pincode: str
    location: Location
