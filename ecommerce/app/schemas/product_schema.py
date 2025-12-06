from pydantic import BaseModel
from typing import Optional, List

class ProductCreate(BaseModel):
    title: str
    description: Optional[str] = None
    price: float
    stock: int
    images: List[str] = []      # must exist
    category: Optional[str] = None

class ProductUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    image: Optional[str] = None
    category: Optional[str] = None
