from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime


class OrderItem(BaseModel):
    cart_item_id: Optional[str] = None # Optional for Buy Now orders
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
    cart_total: Optional[float] = 0.0
    delivery: Optional[float] = 0.0
    total: float
    status: str
    user_profile: Optional[Dict[str, Any]] = None


class OrderResponse(BaseModel):
    order_id: str
    user_id: str

    user_profile: Optional[dict] = None
    items: List[OrderItem]

    cart_total: float
    delivery: float = 0.0  # Default to 0

    total: float

    # 🔥 PAYMENT FIELDS (OPTIONAL for legacy)
    payment_method: Optional[str] = "cod"
    payment_status: Optional[str] = "pending"
    paid_amount: Optional[float] = 0.0

    status: str
    order_number: str
    created_at: datetime
    note: Optional[str] = ""

    shop_owner_ids: List[str]
    razorpay_order_id: Optional[str] = None

    class Config:
        from_attributes = True



class CancelOrderRequest(BaseModel):
    move_to_wishlist: bool = False