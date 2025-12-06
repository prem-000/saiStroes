from fastapi import APIRouter, Depends, HTTPException
from app.utils.oauth2 import get_current_user
from app.services.cart_service import get_cart, clear_cart
from app.services.order_service import create_order
from app.database import get_collection
from pydantic import BaseModel

router = APIRouter(prefix="/checkout", tags=["Checkout"])

profiles = get_collection("user_profiles")


# --------------------------------------------------
# 1️⃣ CHECKOUT SUMMARY
# --------------------------------------------------
@router.get("/summary")
async def checkout_summary(user=Depends(get_current_user)):
    user_id = str(user["_id"])
    cart = await get_cart(user_id)

    items = cart.get("items", [])
    cart_total = cart.get("cart_total", 0)

    if not items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    delivery = 0 if cart_total > 999 else 49
    total = cart_total + delivery

    return {
        "items": items,
        "subtotal": cart_total,
        "delivery": delivery,
        "total": total
    }


# --------------------------------------------------
# 2️⃣ CREATE ORDER (PROFILE REQUIRED)
# --------------------------------------------------
class OrderNote(BaseModel):
    note: str | None = None


@router.post("/create-order")
async def checkout_create_order(payload: OrderNote, user=Depends(get_current_user)):
    user_id = str(user["_id"])
    note = payload.note

    # 1️⃣ CHECK USER PROFILE
    profile = await profiles.find_one({"user_id": user_id})
    if not profile:
        raise HTTPException(status_code=422, detail="Profile missing")

    # remove unwanted fields before storing snapshot
    profile.pop("_id", None)
    profile.pop("user_id", None)

    # 2️⃣ CREATE ORDER WITH PROFILE SNAPSHOT
    created = await create_order(user_id, note, profile)

    if created is None:
        raise HTTPException(status_code=400, detail="Cart is empty")

    return created
