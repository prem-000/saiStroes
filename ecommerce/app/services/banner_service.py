from datetime import date
from app.database import get_collection

banners_collection = get_collection("banners")

async def get_today_banners():
    today = date.today().isoformat()

    banners = []
    async for b in banners_collection.find({
        "is_active": True,
        "start_date": {"$lte": today},
        "end_date": {"$gte": today}
    }).sort("priority", -1):
        banners.append({
            "title": b["title"],
            "image": b["image_url"],
            "redirect": b.get("redirect_url")
        })

    return banners
