from datetime import datetime
import random
from bson import ObjectId

from app.models.order import orders_collection
from app.services.cart_service import get_cart, clear_cart
from app.database import get_collection

profiles = get_collection("user_profiles")


# ----------------------------------------------------
# ORDER NUMBER GENERATOR
# ----------------------------------------------------
def _generate_order_number():
    ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    rnd = random.randint(1000, 9999)
    return f"ORD{ts}{rnd}"


# ----------------------------------------------------
# CREATE ORDER (COD OR ONLINE)
# ----------------------------------------------------
async def create_order(
    user_id: str,
    payment_method: str,          # "cod" | "online"
    note: str | None = None,
    profile: dict | None = None
):
    cart = await get_cart(user_id)
    items = cart.get("items", [])
    cart_total = float(cart.get("cart_total", 0))

    if not items:
        return None

    delivery = 0 if cart_total > 999 else 49
    total = cart_total + delivery

    shop_owner_ids = list({str(i.get("owner_id")) for i in items})

    # -------------------------------------------------
    # PROFILE SNAPSHOT
    # -------------------------------------------------
    if profile is None:
        saved = await profiles.find_one({"user_id": user_id})
        if not saved:
            raise Exception("Profile missing")

        saved.pop("_id", None)
        saved.pop("user_id", None)
        profile = saved

    # -------------------------------------------------
    # PAYMENT LOGIC (CRITICAL)
    # -------------------------------------------------
    if payment_method == "cod":
        payment_status = "pending"
        paid_amount = 0.0
    else:  # online
        payment_status = "pending"   # becomes "paid" after webhook
        paid_amount = total

    # -------------------------------------------------
    # ORDER DOCUMENT
    # -------------------------------------------------
    order_doc = {
        "user_id": user_id,
        "items": items,
        "cart_total": cart_total,
        "delivery": delivery,
        "total": total,

        "payment_method": payment_method,
        "payment_status": payment_status,
        "paid_amount": paid_amount,

        "status": "pending",
        "order_number": _generate_order_number(),
        "created_at": datetime.utcnow(),
        "note": note or "",

        "shop_owner_ids": shop_owner_ids,
        "razorpay_order_id": None,
        "user_profile": profile
    }

    result = await orders_collection.insert_one(order_doc)

    await clear_cart(user_id)

    return {
        "order_id": str(result.inserted_id),
        "order_number": order_doc["order_number"],
        "cart_total": cart_total,
        "delivery": delivery,
        "total": total,
        "status": "pending",
        "payment_method": payment_method,
        "payment_status": payment_status,
        "paid_amount": paid_amount,
        "user_profile": profile
    }


# ----------------------------------------------------
# ATTACH RAZORPAY ORDER ID
# ----------------------------------------------------
async def attach_razorpay_order(order_id: str, razorpay_id: str):
    await orders_collection.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"razorpay_order_id": razorpay_id}}
    )


# ----------------------------------------------------
# MARK ONLINE PAYMENT SUCCESS (WEBHOOK)
# ----------------------------------------------------
async def mark_payment_success(order_id: str):
    await orders_collection.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"payment_status": "paid"}}
    )


# ----------------------------------------------------
# GET ORDERS BY USER
# ----------------------------------------------------
async def get_orders_by_user(user_id: str):
    orders = []

    async for o in orders_collection.find({"user_id": user_id}).sort("created_at", -1):
        o["order_id"] = str(o["_id"])
        o.pop("_id", None)
        orders.append(o)

    return orders


# ----------------------------------------------------
# GET SINGLE ORDER
# ----------------------------------------------------
async def get_order_by_id(order_id: str, user_id: str | None = None):
    try:
        o = await orders_collection.find_one({"_id": ObjectId(order_id)})
    except:
        return None

    if not o:
        return None

    if user_id and o.get("user_id") != user_id:
        return None

    o["order_id"] = str(o["_id"])
    o.pop("_id", None)
    return o
