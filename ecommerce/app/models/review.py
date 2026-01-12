from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ReviewModel(BaseModel):
    product_id: str
    user_id: str
    username: str
    rating: int = Field(..., ge=1, le=5)
    comment: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_approved: bool = True
    
    # Advanced Metrics
    helpful_count: int = 0
    quality_score: float = 1.0  # Default quality
    trust_score: float = 1.0    # Default trust (1 - fake_score)

class ReviewCreate(BaseModel):
    product_id: str
    rating: int = Field(..., ge=1, le=5)
    comment: str
