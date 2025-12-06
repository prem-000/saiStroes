from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from datetime import datetime
import random
from bson import ObjectId

from app.utils.oauth2 import get_current_user
from app.schemas.order_schema import OrderCreateResponse, OrderResponse
from app.services.order_service import (
    create_order,
    get_orders_by_user,
    get_order_by_id
)
from app.services.product_service import get_product_by_id

from app.database import get_collection

orders_collection = get_collection("orders")
profiles_collection = get_collection("user_profiles")
notifications_collection = get_collection("user_notifications")

router = APIRouter(prefix="/orders", tags=["Orders"])


# ---------------------------------------------
# CREATE ORDER FROM CART
# ---------------------------------------------
@router.post("/create", response_model=OrderCreateResponse)
async def checkout(note: Optional[str] = None, user=Depends(get_current_user)):
    user_id = str(user["_id"])
    created = await create_order(user_id, note)

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
    delivery = 0 if cart_total > 999 else 49
    total = cart_total + delivery

    profile = await profiles_collection.find_one({"user_id": user_id})
    if profile:
        profile.pop("_id", None)
        profile.pop("user_id", None)
    else:
        profile = {"name": "Unknown", "phone": "Unknown"}

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
        "total": total,
        "status": "pending",
        "order_number": f"ORD{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{random.randint(1000,9999)}",
        "created_at": datetime.utcnow(),
        "shop_owner_ids": [product["owner_id"]],
        "razorpay_order_id": None,
        "user_profile": profile
    }

    result = await orders_collection.insert_one(order_doc)

    return {
        "order_id": str(result.inserted_id),
        "order_number": order_doc["order_number"],
        "total": total,
        "status": "pending"
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
