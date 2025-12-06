import razorpay
from app.config import settings

client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

async def create_razorpay_order(amount: float, receipt: str):
    amount_in_paise = int(amount * 100)

    order = client.order.create({
        "amount": amount_in_paise,
        "currency": "INR",
        "receipt": receipt,
        "payment_capture": 1
    })

    return order
