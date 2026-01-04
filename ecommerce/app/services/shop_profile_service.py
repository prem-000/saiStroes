# app/services/shop_profile_service.py

from app.database import get_collection

shops_collection = get_collection("shops")

async def create_or_update_shop(owner_id: str, data: dict):
    await shops_collection.update_one(
        {"owner_id": owner_id},
        {
            "$set": {
                "owner_id": owner_id,
                "shop_name": data["shop_name"],
                "category": data["category"],
                "phone": data["phone"],
                "address": data["address"],
                "city": data["city"],
                "pincode": data["pincode"],
                "location": data["location"],   # lat/lng
                "is_completed": True             # 🔥 THIS UNBLOCKS ORDERS
            }
        },
        upsert=True
    )
