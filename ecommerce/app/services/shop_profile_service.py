# app/services/shop_profile_service.py

from app.database import get_collection

shops = get_collection("shop_profiles")


async def create_or_update_shop(owner_id: str, payload: dict):
    # HARD ASSERT (debug safety)
    if not payload.get("location"):
        raise Exception("Location missing in payload")

    await shops.update_one(
        {"owner_id": owner_id},
        {
            "$set": {
                "owner_id": owner_id,
                "shop_name": payload["shop_name"],
                "category": payload["category"],
                "phone": payload["phone"],
                "address": payload["address"],
                "city": payload["city"],
                "pincode": payload["pincode"],
                "location": {
                    "lat": payload["location"]["lat"],
                    "lng": payload["location"]["lng"],
                },
            }
        },
        upsert=True
    )

async def get_shop_profile(owner_id: str):
    profile = await shops.find_one({"owner_id": owner_id})
    if profile:
        profile["_id"] = str(profile["_id"])
    return profile
