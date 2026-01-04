from app.database import db

collection = db["shop_profiles"]

async def create_or_update_shop(owner_id, data):
    await collection.update_one(
        {"owner_id": owner_id},
        {"$set": {**data, "owner_id": owner_id}},
        upsert=True
    )

async def get_shop(owner_id):
    return await collection.find_one({"owner_id": owner_id})
