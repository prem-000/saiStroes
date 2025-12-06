from fastapi import APIRouter, Depends
from app.database import get_collection
from app.utils.oauth2 import get_current_user
from app.schemas.profile_schema import UserProfile
from app.utils.serializer import serialize_doc

router = APIRouter(prefix="/profile", tags=["User Profile"])

profiles = get_collection("user_profiles")


@router.get("/me")
async def get_my_profile(user=Depends(get_current_user)):
    user_id = str(user["_id"])
    profile = await profiles.find_one({"user_id": user_id})
    return serialize_doc(profile) if profile else {}


@router.post("/update")
async def update_profile(payload: UserProfile, user=Depends(get_current_user)):
    user_id = str(user["_id"])

    await profiles.update_one(
        {"user_id": user_id},
        {"$set": {**payload.dict(), "user_id": user_id}},
        upsert=True
    )

    return {"status": "updated"}
