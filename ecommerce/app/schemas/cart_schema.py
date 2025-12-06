from pydantic import BaseModel
from typing import Optional

class CartItem(BaseModel):
    product_id: str
    quantity: int

class CartUpdate(BaseModel):
    quantity: int
