from app.database import db

collection = db["shop_bank_details"]

async def save_bank_details(owner_id, data):
    await collection.update_one(
        {"owner_id": owner_id},
        {"$set": {**data, "owner_id": owner_id}},
        upsert=True
    )
