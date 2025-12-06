from fastapi import APIRouter, Request, HTTPException
import hmac, hashlib
from app.config import settings
from app.models.order import orders_collection

router = APIRouter(prefix="/webhook", tags=["Webhooks"])

@router.post("/razorpay")
async def razorpay_webhook(request: Request):
    body = await request.body()
    received_sig = request.headers.get("X-Razorpay-Signature")

    secret = settings.RAZORPAY_KEY_SECRET.encode()

    expected_sig = hmac.new(secret, body, hashlib.sha256).hexdigest()

    if not hmac.compare_digest(received_sig, expected_sig):
        raise HTTPException(status_code=400, detail="Invalid signature")

    data = await request.json()

    # payment successful event
    if data["event"] == "payment.captured":
        razorpay_order_id = data["payload"]["payment"]["entity"]["order_id"]

        await orders_collection.update_one(
            {"razorpay_order_id": razorpay_order_id},
            {"$set": {"status": "paid"}}
        )

    return {"status": "ok"}
