from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from app.models.shop_owner import shop_owners_collection
from app.utils.admin_authenticate import admin_auth

router = APIRouter(prefix="/admin/shop-owners", tags=["Admin Shop Owners"])


# ---------------------------
# BLOCK SHOP OWNER
# ---------------------------
@router.put("/{owner_id}/block")
async def block_shop_owner(owner_id: str, admin=Depends(admin_auth)):
    result = await shop_owners_collection.update_one(
        {"_id": ObjectId(owner_id)},
        {"$set": {"blocked": True}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Shop owner not found")

    return {"message": "Shop owner blocked successfully"}


# ---------------------------
# UNBLOCK SHOP OWNER
# ---------------------------
@router.put("/{owner_id}/unblock")
async def unblock_shop_owner(owner_id: str, admin=Depends(admin_auth)):
    result = await shop_owners_collection.update_one(
        {"_id": ObjectId(owner_id)},
        {"$set": {"blocked": False}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Shop owner not found")

    return {"message": "Shop owner unblocked successfully"}


# ---------------------------
# LIST ALL SHOP OWNERS
# ---------------------------
@router.get("/")
async def list_all_shop_owners(admin=Depends(admin_auth)):
    owners = []
    async for o in shop_owners_collection.find():
        o["id"] = str(o["_id"])
        del o["_id"]
        owners.append(o)
    return owners
