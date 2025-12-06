from pydantic import BaseModel
from typing import List, Optional

class UIConfigUpdate(BaseModel):
    banners: Optional[List[str]] = None
    announcements: Optional[List[str]] = None
    theme: Optional[str] = None
