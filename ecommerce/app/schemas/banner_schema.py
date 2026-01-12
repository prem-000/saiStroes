from pydantic import BaseModel

class BannerResponse(BaseModel):
    title: str
    image: str
    redirect: str | None = None
