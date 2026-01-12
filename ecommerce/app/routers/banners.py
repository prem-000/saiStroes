from fastapi import APIRouter, HTTPException
from datetime import date
from app.database import get_collection
from app.models.banner import BannerCreate

router = APIRouter(
    prefix="/api/banners",
    tags=["Banners"]
)

banners_collection = get_collection("banners")


@router.post("/")
async def create_banner(banner: BannerCreate):
    result = await banners_collection.insert_one(banner.dict())
    return {"message": "Banner created", "id": str(result.inserted_id)}


@router.get("/")
async def get_today_banners():
    today = date.today().isoformat()  # YYYY-MM-DD

    banners = []

    async for b in banners_collection.find({
        "is_active": True,
        "start_date": {"$lte": today},
        "end_date": {"$gte": today}
    }).sort("priority", -1):

        banners.append({
            "title": b.get("title", ""),
            "image": b.get("image_url", ""),
            "redirect": b.get("redirect_url", "")
        })

    return banners
