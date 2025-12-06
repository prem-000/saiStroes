from app.models.user import users_collection
from app.utils.hashing import Hash
from bson import ObjectId

async def create_user(user_data):
    data = user_data.dict()
    data["password"] = Hash.hash_password(data["password"])
    data["blocked"] = False     # important

    result = await users_collection.insert_one(data)
    return str(result.inserted_id)




async def find_user_by_email(email: str):
    return await users_collection.find_one({"email": email})
