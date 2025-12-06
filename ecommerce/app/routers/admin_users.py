from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from app.models.user import users_collection
from app.utils.admin_authenticate import admin_auth

router = APIRouter(prefix="/admin/users", tags=["Admin Users"])


# ---------------------------
# BLOCK USER
# ---------------------------
@router.put("/{user_id}/block")
async def block_user(user_id: str, admin=Depends(admin_auth)):
    result = await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"blocked": True}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": "User blocked successfully"}


# ---------------------------
# UNBLOCK USER
# ---------------------------
@router.put("/{user_id}/unblock")
async def unblock_user(user_id: str, admin=Depends(admin_auth)):
    result = await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"blocked": False}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": "User unblocked successfully"}


# ---------------------------
# LIST ALL USERS
# ---------------------------
@router.get("/")
async def list_all_users(admin=Depends(admin_auth)):
    users = []
    async for u in users_collection.find():
        u["id"] = str(u["_id"])
        del u["_id"]
        users.append(u)
    return users
