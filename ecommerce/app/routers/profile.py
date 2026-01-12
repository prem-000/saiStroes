from fastapi import APIRouter, Depends, HTTPException
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

    if not profile:
        return {}

    return serialize_doc(profile)


@router.post("/update")
async def update_profile(payload: UserProfile, user=Depends(get_current_user)):
    user_id = str(user["_id"])

    # HARD VALIDATION (DO NOT REMOVE)
    if payload.lat is None or payload.lng is None:
        raise HTTPException(
            status_code=422,
            detail="Location is required. Please pin your address on the map."
        )

    await profiles.update_one(
        {"user_id": user_id},
        {
            "$set": {
                **payload.dict(),
                "user_id": user_id
            }
        },
        upsert=True
    )

    return {"status": "updated"}
