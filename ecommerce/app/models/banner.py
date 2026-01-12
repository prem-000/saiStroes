from pydantic import BaseModel
from typing import Optional
from datetime import date

class BannerModel(BaseModel):
    title: str
    image_url: str
    redirect_url: Optional[str] = None
    priority: int = 0
    is_active: bool = True
    start_date: str  # YYYY-MM-DD
    end_date: str    # YYYY-MM-DD

class BannerCreate(BannerModel):
    pass
