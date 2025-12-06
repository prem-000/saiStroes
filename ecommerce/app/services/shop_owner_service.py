from app.database import get_collection
from bson import ObjectId
from passlib.context import CryptContext

shop_owner_collection = get_collection("shop_owners")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ----------------------------------------------------
# CREATE SHOP OWNER (REGISTER)
# ----------------------------------------------------
async def create_shop_owner(name: str, email: str, password: str):
    existing = await shop_owner_collection.find_one({"email": email})
    if existing:
        return None  # email exists

    hashed_pw = pwd_context.hash(password)

    doc = {
        "name": name,
        "email": email,
        "password": hashed_pw
    }

    result = await shop_owner_collection.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


# ----------------------------------------------------
# FIND SHOP OWNER BY EMAIL (LOGIN)
# ----------------------------------------------------
async def find_shop_owner_by_email(email: str):
    try:
        return await shop_owner_collection.find_one({"email": email})
    except:
        return None


# ----------------------------------------------------
# FIND SHOP OWNER BY ID (AUTH)
# ----------------------------------------------------
async def find_shop_owner_by_id(owner_id: str):
    try:
        return await shop_owner_collection.find_one({"_id": ObjectId(owner_id)})
    except:
        return None
