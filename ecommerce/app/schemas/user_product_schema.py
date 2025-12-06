from pydantic import BaseModel
from typing import List, Optional


class UserProduct(BaseModel):
    id: str
    title: str
    description: Optional[str] = ""
    price: float
    stock: int
    image: Optional[str] = ""
    owner_id: str

    class Config:
        orm_mode = True
