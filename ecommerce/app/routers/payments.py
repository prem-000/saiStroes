from fastapi import APIRouter, Depends, HTTPException
from app.utils.oauth2 import get_current_user
from app.services.order_service import get_order_by_id, attach_razorpay_order
from app.services.payment_service import create_razorpay_order
from app.config import settings

router = APIRouter(prefix="/pay", tags=["Payments"])

@router.post("/create/{order_id}")
async def create_payment_order(order_id: str, user=Depends(get_current_user)):
    user_id = str(user["_id"])

    order = await get_order_by_id(order_id, user_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Use the FINAL TOTAL AMOUNT
    amount = order["total"]  # includes delivery

    razor = await create_razorpay_order(
        amount=amount,
        receipt=order["order_number"]
    )

    # Save razorpay order ID inside database
    await attach_razorpay_order(order_id, razor["id"])

    return {
        "success": True,
        "order_id": order_id,
        "amount": amount,
        "razorpay_order_id": razor["id"],
        "razorpay_key": settings.RAZORPAY_KEY_ID
    }
