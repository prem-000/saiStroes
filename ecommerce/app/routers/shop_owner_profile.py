from fastapi import APIRouter, Depends
from app.services.shop_profile_service import create_or_update_shop, get_shop_profile 
from app.utils.shop_owner_authenticate import owner_auth
from app.schemas.shop_profile_schema import ShopProfileCreate

router = APIRouter(prefix="/shop-owner/profile", tags=["Shop Owner Profile"])

@router.get("/")
async def get_my_shop_profile(owner=Depends(owner_auth)):
    profile = await get_shop_profile(str(owner["_id"]))
    return profile or {}

@router.post("/")
async def save_shop_profile(
    payload: ShopProfileCreate,
    owner=Depends(owner_auth)
):
    await create_or_update_shop(str(owner["_id"]), payload.dict())
    return {"message": "Shop profile saved"}
