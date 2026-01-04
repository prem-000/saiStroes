from fastapi import APIRouter, Depends
from app.services.shop_profile_service import create_or_update_shop
from app.utils.shop_owner_authenticate import owner_auth
from app.schemas.shop_profile_schema import ShopProfileCreate

router = APIRouter(prefix="/shop-owner/profile", tags=["Shop Owner Profile"])

@router.post("/")
async def save_shop_profile(
    payload: ShopProfileCreate,
    owner=Depends(owner_auth)
):
    await create_or_update_shop(str(owner["_id"]), payload.dict())
    return {"message": "Shop profile saved"}
