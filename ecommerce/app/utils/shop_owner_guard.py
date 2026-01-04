# app/utils/shop_owner_guard.py

from fastapi import HTTPException
from app.database import get_collection

shops_collection = get_collection("shops")

async def ensure_shop_profile_completed(owner_id: str):
    shop = await shops_collection.find_one({"owner_id": owner_id})

    if not shop or not shop.get("is_completed"):
        raise HTTPException(
            status_code=400,
            detail="Shop profile incomplete. Complete onboarding first."
        )
