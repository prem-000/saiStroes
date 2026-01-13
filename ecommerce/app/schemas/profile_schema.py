from pydantic import BaseModel
from typing import Optional

class UserProfile(BaseModel):
    name: str
    phone: str
    email: Optional[str] = ""
    gender: Optional[str] = ""
    address: str
    pincode: Optional[str] = ""
    city: Optional[str] = ""
    state: Optional[str] = ""
     # REQUIRED FOR DISTANCE
    lat: float
    lng: float
