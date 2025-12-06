from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from datetime import datetime


class OrderItem(BaseModel):
    cart_item_id: str
    product_id: str
    title: str
    image: str
    quantity: int
    price: float
    item_total: float
    owner_id: str

class UserProfile(BaseModel):
    name: str
    phone: str
    address: str
    pincode: str
    city: str
    state: str

class OrderCreateResponse(BaseModel):
    order_id: str
    order_number: str
    cart_total: float
    status: str
    delivery: float
    total: float
    user_profile: Dict[str, Any]  # Optional for frontend usage

class OrderResponse(BaseModel):
    order_id: str
    user_id: str

    # ↓↓↓ FIX: user_profile is now optional
    user_profile: Optional[dict] = None

    items: List[OrderItem]
    cart_total: float
    delivery: float
    total: float
    status: str
    order_number: str
    created_at: datetime
    note: Optional[str] = ""
    shop_owner_ids: List[str]
    razorpay_order_id: Optional[str] = None

    class Config:
        from_attributes = True