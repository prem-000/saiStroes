from app.models.admin import admin_collection
from app.utils.hashing import Hash

async def create_admin(admin_data):
    data = admin_data.dict()
    data["password"] = Hash.hash_password(data["password"])

    result = await admin_collection.insert_one(data)
    return str(result.inserted_id)

async def find_admin_by_email(email: str):
    return await admin_collection.find_one({"email": email})
