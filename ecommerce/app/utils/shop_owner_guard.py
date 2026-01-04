from fastapi import HTTPException
from app.database import get_collection

shop_profiles = get_collection("shop_profiles")

async def ensure_shop_profile_completed(owner_id: str):
    shop = await shop_profiles.find_one({"owner_id": owner_id})

    if not shop:
        raise HTTPException(
            status_code=403,
            detail="Shop profile not created. Complete onboarding first."
        )

    required_fields = [
        "shop_name", "address", "city",
        "pincode", "latitude", "longitude"
    ]

    for field in required_fields:
        if not shop.get(field):
            raise HTTPException(
                status_code=403,
                detail="Shop profile incomplete. Complete onboarding first."
            )

    if not shop.get("is_verified", False):
        raise HTTPException(
            status_code=403,
            detail="Shop is under verification."
        )

    return shop
