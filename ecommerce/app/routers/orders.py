from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Optional
from datetime import datetime
import random
from bson import ObjectId
from pydantic import BaseModel

from app.utils.oauth2 import get_current_user
from app.schemas.order_schema import OrderCreateResponse, OrderResponse
from app.services.order_service import (
    create_order,
    get_orders_by_user,
    get_order_by_id
)
from app.services.product_service import get_product_by_id

from app.database import get_collection
transactions_collection = get_collection("transactions")
shops_collection = get_collection("shop_profiles")
profiles_collection = get_collection("user_profiles")
orders_collection = get_collection("orders")
notifications_collection = get_collection("notifications")

from app.utils.distance import haversine_km

router = APIRouter(prefix="/orders", tags=["Orders"])

from app.schemas.checkout_schema import CheckoutCreateOrder

# ---------------------------------------------
# CREATE ORDER FROM CART
# ---------------------------------------------
@router.post("/create", response_model=OrderCreateResponse)
async def checkout(
    payload: CheckoutCreateOrder, 
    user=Depends(get_current_user)
):
    user_id = str(user["_id"])
    
    # Convert Pydantic to dict
    address_dict = payload.delivery_address.dict()
    
    created = await create_order(
        user_id, 
        payload.payment_method, 
        address_dict, 
        payload.note, 
        payload.claim_new_user
    )

    if created is None:
        raise HTTPException(status_code=400, detail="Cart is empty")

    return created


# ---------------------------------------------
# LIST USER ORDERS
# (Cancelled orders hidden automatically)
# ---------------------------------------------
@router.get("/", response_model=list[OrderResponse])
async def list_my_orders(user=Depends(get_current_user)):
    return await get_orders_by_user(str(user["_id"]))


# ---------------------------------------------
# GET SINGLE ORDER
# ---------------------------------------------
@router.get("/{order_id}", response_model=OrderResponse)
async def fetch_order(order_id: str, user=Depends(get_current_user)):
    order = await get_order_by_id(order_id, str(user["_id"]))
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


# ---------------------------------------------
# BUY NOW
# ---------------------------------------------
@router.post("/buy-now/{product_id}")
async def buy_now(product_id: str, user=Depends(get_current_user)):
    user_id = str(user["_id"])

    product = await get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    cart_total = float(product["price"])
    
    # ---------------- DELIVERY CALCULATIONS ----------------
    profile = await profiles_collection.find_one({"user_id": user_id})
    if not profile or "location" not in profile:
         # Fallback if no location: allow order but warn? Or strictly require it.
         # For now, let's assume if they don't have location, we can't calc delivery.
         # But the legacy logic allowed it. Let's enforce location or default to high fee?
         # Better: raise error if they need delivery.
         raise HTTPException(400, "Please update your profile with a delivery location first.")
    
    shop = await shops_collection.find_one({"owner_id": product["owner_id"]})
    if not shop or "location" not in shop:
         raise HTTPException(422, "Shop information currently unavailable.")

    distance = haversine_km(
        profile["location"]["lat"],
        profile["location"]["lng"],
        shop["location"]["lat"],
        shop["location"]["lng"]
    )

    if distance <= 7:
        delivery = 0
    else:
        delivery = int((distance - 7) * 10 + 20)
    
    total = cart_total + delivery

    if profile:
        profile.pop("_id", None)
        profile.pop("user_id", None)

    order_doc = {
        "user_id": user_id,
        "items": [{
            "product_id": product_id,
            "title": product["title"],
            "price": product["price"],
            "image": product.get("image", ""),
            "quantity": 1,
            "owner_id": product["owner_id"],
            "item_total": product["price"]
        }],
        "cart_total": cart_total,
        "delivery": delivery,
        "delivery_fee": delivery, # Backward compatibility
        "total": total,
        "payment_method": "cod", # Default for buy now
        "payment_status": "pending",
        "paid_amount": 0,
        "status": "pending",
        "order_number": f"ORD{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{random.randint(1000,9999)}",
        "created_at": datetime.utcnow(),
        "shop_owner_ids": [product["owner_id"]],
        "delivery_distance_km": distance,
        "razorpay_order_id": None,
        "user_profile": profile
    }

    result = await orders_collection.insert_one(order_doc)

    return {
        "order_id": str(result.inserted_id),
        "order_number": order_doc["order_number"],
        "cart_total": cart_total,
        "delivery": delivery,
        "total": total,
        "status": "pending",
        "user_profile": profile
    }


# ---------------------------------------------
# DELETE ENTIRE ORDER
# ---------------------------------------------
@router.delete("/{order_id}")
async def delete_order(order_id: str, user=Depends(get_current_user)):
    user_id = str(user["_id"])

    order = await orders_collection.find_one({"_id": ObjectId(order_id), "user_id": user_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    await orders_collection.delete_one({"_id": ObjectId(order_id)})
    return {"message": "Order deleted"}


# ---------------------------------------------
# CANCEL ORDER (USER)
# ---------------------------------------------


# ---------------------------------------------
# DELETE ITEM FROM ORDER
# ---------------------------------------------
@router.delete("/item/{order_id}/{product_id}")
async def delete_order_item(order_id: str, product_id: str, user=Depends(get_current_user)):
    user_id = str(user["_id"])

    order = await orders_collection.find_one({"_id": ObjectId(order_id), "user_id": user_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    updated_items = [i for i in order["items"] if i["product_id"] != product_id]

    if len(updated_items) == len(order["items"]):
        raise HTTPException(status_code=404, detail="Product not found in order")

    await orders_collection.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"items": updated_items}}
    )

    return {"message": "Order item removed"}


# ---------------------------------------------
# USER NOTIFICATIONS LIST
# ---------------------------------------------
# ---------------------------------------------
# USER NOTIFICATIONS LIST
# ---------------------------------------------
@router.get("/notifications/me")
async def get_notifications(user=Depends(get_current_user)):
    user_id = str(user["_id"])

    notifications = []
    async for n in notifications_collection.find({"user_id": user_id}).sort("timestamp", -1):
        n["_id"] = str(n["_id"])
        notifications.append(n)

    return notifications


# ---------------------------------------------
# MARK NOTIFICATION AS READ
# ---------------------------------------------
@router.put("/notifications/mark-read/{notif_id}")
async def mark_read(notif_id: str, user=Depends(get_current_user)):
    user_id = str(user["_id"])

    updated = await notifications_collection.update_one(
        {"_id": ObjectId(notif_id), "user_id": user_id},
        {"$set": {"read": True}}
    )

    if updated.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")

    return {"message": "Notification marked as read"}


# ---------------------------------------------
# CANCEL ORDER (USER) + OPTIONAL MOVE TO WISHLIST
# ---------------------------------------------
from app.schemas.order_schema import CancelOrderRequest
from app.database import get_collection

wishlist_collection = get_collection("wishlist")

@router.put("/{order_id}/cancel")
async def cancel_order(
    order_id: str,
    payload: CancelOrderRequest,
    user=Depends(get_current_user)
):
    user_id = str(user["_id"])

    order = await orders_collection.find_one({
        "_id": ObjectId(order_id),
        "user_id": user_id
    })

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order["status"] not in ["pending", "accepted", "packed"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel order with status: {order['status']}"
        )

    # ---------------- RESTORE STOCK ----------------
    if order.get("stock_reduced"):
        from app.models.products import products_collection

        for item in order["items"]:
            await products_collection.update_one(
                {"_id": ObjectId(item["product_id"])},
                {"$inc": {"stock": item["quantity"]}}
            )

    # ---------------- MOVE ITEMS TO WISHLIST ----------------
    moved_items = []

    if payload.move_to_wishlist:
        for item in order["items"]:

            exists = await wishlist_collection.find_one({
                "user_id": user_id,
                "product_id": item["product_id"]
            })

            if not exists:
                await wishlist_collection.insert_one({
                    "user_id": user_id,
                    "product_id": item["product_id"],
                    "created_at": datetime.utcnow().isoformat(),
                    "source": "order_cancel",
                    "order_id": str(order["_id"])
                })

                moved_items.append(item["product_id"])

    # ---------------- UPDATE ORDER STATUS ----------------
    await orders_collection.update_one(
        {"_id": ObjectId(order_id)},
        {
            "$set": {
                "status": "cancelled",
                "stock_reduced": False,
                "cancelled_at": datetime.utcnow()
            }
        }
    )

    return {
        "message": "Order cancelled successfully",
        "moved_to_wishlist": payload.move_to_wishlist,
        "items_added_to_wishlist": moved_items
    }
