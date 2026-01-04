from fastapi import APIRouter, Depends
from app.services.shop_bank_service import save_bank_details
from app.utils.shop_owner_authenticate import owner_auth
from app.schemas.shop_bank_schema import ShopBankCreate

router = APIRouter(prefix="/shop-owner/bank", tags=["Shop Owner Bank"])

@router.post("/")
async def save_bank(
    payload: ShopBankCreate,
    owner=Depends(owner_auth)
):
    await save_bank_details(str(owner["_id"]), payload.dict())
    return {"message": "Bank details saved"}
