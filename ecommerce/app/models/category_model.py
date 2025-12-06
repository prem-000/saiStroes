from typing import Optional
from dataclasses import dataclass

@dataclass
class Category:
    id: Optional[str]
    name: str
    description: Optional[str] = ""
