from datetime import datetime
import random
from bson import ObjectId

from app.database import get_collection
from app.services.cart_service import get_cart, clear_cart
from app.services.delivery_service import calculate_delivery_cost
from app.services.discount_service import calculate_offers
from app.utils.distance import haversine_km

orders_collection = get_collection("orders")
profiles = get_collection("user_profiles")
shops = get_collection("shop_profiles")


def _generate_order_number():
    ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    rnd = random.randint(1000, 9999)
    return f"ORD{ts}{rnd}"

# ----------------------------------------------------
# CREATE ORDER (FINAL – DISTANCE BASED)
# ----------------------------------------------------
async def create_order(
    user_id: str,
    payment_method: str,
    delivery_address: dict,
    note: str | None = None,
    claim_new_user: bool = False  
):
    cart = await get_cart(user_id)
    items = cart.get("items", [])
    cart_total = float(cart.get("cart_total", 0))

    if not items:
        return None

    # ---------------- USER LOCATION ----------------
    user_lat = delivery_address["lat"]
    user_lng = delivery_address["lng"]

    # ---------------- SHOP LOCATION ----------------
    # Assuming single shop owner for now or first item's owner
    owner_id = items[0]["owner_id"]
    shop = await shops.find_one({"owner_id": owner_id})
    if not shop or not shop.get("location"):
        raise Exception("Shop location missing")

    shop_lat = shop["location"]["lat"]
    shop_lng = shop["location"]["lng"]

    # ---------------- DISTANCE ----------------
    distance_km = haversine_km(
        user_lat, user_lng,
        shop_lat, shop_lng
    )

    # ---------------- DELIVERY FEE ----------------
    # Use Centralized Service
    delivery_info = calculate_delivery_cost(distance_km, cart_total)
    delivery_fee = delivery_info["fee"]

    # ---------------- DISCOUNTS ----------------
    # Use Centralized Service
    offers = await calculate_offers(user_id, cart_total, claim_new_user)
    discount_amount = offers["discount_amount"]
    
    # ---------------- FINAL TOTAL ----------------
    total = cart_total + delivery_fee - discount_amount
    total = max(0, total) # Safety

    # ---------------- PROFILE SNAPSHOT ----------------
    profile = await profiles.find_one({"user_id": user_id})
    if not profile:
        raise Exception("Profile missing")

    profile.pop("_id", None)
    profile.pop("user_id", None)

    # ---------------- PAYMENT ----------------
    payment_status = "pending"
    paid_amount = 0 if payment_method == "cod" else total

    # ---------------- ORDER DOC ----------------
    order_doc = {
        "user_id": user_id,
        "items": items,

        "cart_total": cart_total,
        "delivery": delivery_fee, # Standardized name
        "delivery_fee": delivery_fee, # Keep for backward compatibility if needed
        "delivery_breakdown": delivery_info["breakdown"],
        "delivery_distance_km": distance_km,
        
        "discount_amount": discount_amount,
        "discount_code": offers["applied_coupon"],
        "discount_msg": offers["message"],
        
        "total": total,

        "payment_method": payment_method,
        "payment_status": payment_status,
        "paid_amount": paid_amount,

        "status": "pending",
        "order_number": _generate_order_number(),
        "created_at": datetime.utcnow(),
        "note": note or "",

        "shop_owner_ids": [owner_id],
        "razorpay_order_id": None,

        "user_profile": profile
    }

    result = await orders_collection.insert_one(order_doc)
    await clear_cart(user_id)

    return {
        "order_id": str(result.inserted_id),
        "order_number": order_doc["order_number"],
        "cart_total": cart_total,
        "delivery": delivery_fee,
        "total": total,
        "status": "pending",
        "user_profile": profile
    }


# ----------------------------------------------------
# SUPPORTING FUNCTIONS (REQUIRED BY ORDERS ROUTER)
# ----------------------------------------------------
async def attach_razorpay_order(order_id: str, razorpay_id: str):
    await orders_collection.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"razorpay_order_id": razorpay_id}}
    )


async def mark_payment_success(order_id: str):
    await orders_collection.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"payment_status": "paid"}}
    )


async def get_orders_by_user(user_id: str):
    orders = []
    async for o in orders_collection.find(
        {"user_id": user_id}
    ).sort("created_at", -1):
        o["order_id"] = str(o["_id"])
        o.pop("_id", None)
        # Ensure 'delivery' field exists for older records
        if "delivery" not in o and "delivery_fee" in o:
            o["delivery"] = o["delivery_fee"]
        
        # Ensure 'note' is a string
        if not isinstance(o.get("note"), str):
            o["note"] = ""
            
        orders.append(o)
    return orders


async def get_order_by_id(order_id: str, user_id: str | None = None):
    try:
        o = await orders_collection.find_one(
            {"_id": ObjectId(order_id)}
        )
    except:
        return None

    if not o:
        return None

    if user_id and o.get("user_id") != user_id:
        return None

    o["order_id"] = str(o["_id"])
    o.pop("_id", None)
    # Ensure 'delivery' field exists for older records
    if "delivery" not in o and "delivery_fee" in o:
        o["delivery"] = o["delivery_fee"]
    
    # Ensure 'note' is a string
    if not isinstance(o.get("note"), str):
        o["note"] = ""
        
    return o
