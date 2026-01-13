from fastapi import APIRouter, Depends, Query, HTTPException
from app.utils.oauth2 import get_current_user
from app.services.cart_service import get_cart
from app.services.order_service import create_order
from app.services.delivery_service import calculate_delivery_cost
from app.services.discount_service import calculate_offers
from app.database import get_collection
from app.schemas.checkout_schema import CheckoutCreateOrder
from app.utils.distance import haversine_km
from bson import ObjectId
import math

router = APIRouter(prefix="/checkout", tags=["Checkout"])

profiles = get_collection("user_profiles")
shops = get_collection("shop_profiles")
products_collection = get_collection("products")
users_collection = get_collection("users")

# --------------------------------------------------
# CHECKOUT SUMMARY
# --------------------------------------------------
@router.get("/summary")
async def checkout_summary(
    claim_new_user: bool = Query(False),
    user=Depends(get_current_user)
):
    """
    Returns detailed checkout summary with discounts and delivery fees.
    """
    user_id = str(user["_id"])
    cart = await get_cart(user_id)
    
    if not cart or not cart["items"]:
        return {"cart_subtotal": 0, "final_total": 0, "items": [], "discount": 0, "delivery_fee": 0}

    # 1. Calculate Subtotal
    subtotal = 0
    items_details = []
    
    # We need arbitrary shop location for distance calc
    shop_owner_id = None

    for item in cart["items"]:
        p = await products_collection.find_one({"_id": ObjectId(item["product_id"])})
        if p:
            if not shop_owner_id:
                shop_owner_id = str(p.get("owner_id"))
            
            line_total = p["price"] * item["quantity"]
            subtotal += line_total
            items_details.append({
                "title": p["title"],
                "price": p["price"],
                "quantity": item["quantity"],
                "total": line_total,
                "image": p.get("image", "")
            })

    # 2. Calculate Discounts
    offers = await calculate_offers(user_id, subtotal, claim_new_user)
    discount_amount = offers["discount_amount"]
    
    # 3. Calculate Delivery
    delivery_info = {"fee": 0.0, "breakdown": "Location needed"}
    
    # Refetch user to get location from user_profiles collection
    user_profile = await profiles.find_one({"user_id": user_id})
    
    if user_profile and user_profile.get("lat") and shop_owner_id:
        shop = await shops.find_one({"owner_id": shop_owner_id})
        
        if shop and shop.get("location"):
            dist = haversine_km(
                user_profile["lat"], user_profile["lng"],
                shop["location"]["lat"], shop["location"]["lng"]
            )
            delivery_info = calculate_delivery_cost(dist, subtotal)

    delivery_fee = delivery_info["fee"]

    # 4. Final Total
    tax = 0 
    final_total = subtotal - discount_amount + delivery_fee + tax

    return {
        "cart_subtotal": round(subtotal, 2),
        "discount": discount_amount,
        "discount_code": offers["applied_coupon"],
        "discount_msg": offers["message"],
        "delivery_fee": delivery_fee,
        "delivery_breakdown": delivery_info["breakdown"],
        "tax": tax,
        "final_total": max(0, round(final_total, 2)),
        "items": items_details
    }


# --------------------------------------------------
# CREATE ORDER (RECALCULATE — NO TRUST ON FRONTEND)
# --------------------------------------------------
@router.post("/create-order")
async def checkout_create_order(
    payload: CheckoutCreateOrder,
    user=Depends(get_current_user)
):
    user_id = str(user["_id"])

    profile = await profiles.find_one({"user_id": user_id})
    if not profile:
        raise HTTPException(422, "Profile missing")

    cart = await get_cart(user_id)
    if not cart.get("items"):
        raise HTTPException(400, "Cart is empty")

    order = await create_order(
        user_id=user_id,
        payment_method=payload.payment_method,
        delivery_address=payload.delivery_address.dict(),
        note=payload.note
    )
    
    return order
