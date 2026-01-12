from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from pydantic import BaseModel
from datetime import datetime

from app.utils.shop_owner_guard import ensure_shop_profile_completed
from app.utils.shop_owner_authenticate import owner_auth
from app.models.order import orders_collection
from app.models.products import products_collection
from app.database import get_collection

notifications_collection = get_collection("user_notifications")

router = APIRouter(
    prefix="/shop-owner/orders",
    tags=["Shop Owner Orders"]
)

# -----------------------------------------------------------
# STATUS FLOW
# -----------------------------------------------------------
def get_next_statuses(current: str):
    return {
        "pending": ["accepted", "cancelled"],
        "accepted": ["packed", "cancelled"],
        "packed": ["shipped", "cancelled"],
        "shipped": ["delivered"],
        "delivered": [],
        "cancelled": []
    }.get(current, [])


# -----------------------------------------------------------
# GET ALL ORDERS (OWNER VIEW)
# -----------------------------------------------------------
@router.get("/")
async def get_my_orders(owner=Depends(owner_auth)):
    owner_id = str(owner["_id"])
    await ensure_shop_profile_completed(owner_id)

    orders = []

    async for o in orders_collection.find(
        {"shop_owner_ids": owner_id}
    ).sort("created_at", -1):

        owner_items = [
            i for i in o.get("items", [])
            if str(i.get("owner_id")) == owner_id
        ]

        if not owner_items:
            continue

        orders.append({
            "id": str(o["_id"]),
            "order_number": o["order_number"],
            "created_at": o["created_at"],
            "status": o["status"],
            "next_statuses": get_next_statuses(o["status"]),

            # PAYMENT INFO
            "payment_method": o.get("payment_method", "cod"),
            "payment_status": o.get("payment_status", "pending"),
            "paid_amount": o.get("paid_amount", 0.0),

            "items": owner_items,
            "user": o.get("user_profile", {}),

            # ✅ LOCATION SNAPSHOTS (FOR MAP + DISTANCE)
            "shop_location": o.get("shop_location"),
            "user_location": o.get("user_location")
        })

    return orders


# -----------------------------------------------------------
# GET SINGLE ORDER (OWNER VIEW)
# -----------------------------------------------------------
@router.get("/{order_id}")
async def get_order(order_id: str, owner=Depends(owner_auth)):
    owner_id = str(owner["_id"])
    await ensure_shop_profile_completed(owner_id)

    o = await orders_collection.find_one(
        {"_id": ObjectId(order_id)}
    )
    if not o:
        raise HTTPException(404, "Order not found")

    if owner_id not in o.get("shop_owner_ids", []):
        raise HTTPException(403, "Not your order")

    owner_items = [
        i for i in o.get("items", [])
        if str(i.get("owner_id")) == owner_id
    ]

    return {
        "id": str(o["_id"]),
        "order_number": o["order_number"],
        "created_at": o["created_at"],
        "status": o["status"],
        "next_statuses": get_next_statuses(o["status"]),

        "payment": {
            "method": o.get("payment_method", "cod"),
            "status": o.get("payment_status", "pending"),
            "paid_amount": o.get("paid_amount", 0.0)
        },

        "items": owner_items,
        "user": o.get("user_profile", {}),

        # ✅ REQUIRED FOR MAP + DISTANCE
        "shop_location": o.get("shop_location"),
        "user_location": o.get("user_location")
    }


# -----------------------------------------------------------
# STATUS UPDATE MODEL
# -----------------------------------------------------------
class StatusUpdate(BaseModel):
    status: str


# -----------------------------------------------------------
# UPDATE ORDER STATUS
# -----------------------------------------------------------
@router.put("/{order_id}/status")
async def update_order_status(
    order_id: str,
    payload: StatusUpdate,
    owner=Depends(owner_auth)
):
    owner_id = str(owner["_id"])
    await ensure_shop_profile_completed(owner_id)

    new_status = payload.status

    o = await orders_collection.find_one(
        {"_id": ObjectId(order_id)}
    )
    if not o:
        raise HTTPException(404, "Order not found")

    if owner_id not in o.get("shop_owner_ids", []):
        raise HTTPException(403, "Unauthorized")

    old_status = o["status"]

    if new_status == old_status:
        raise HTTPException(400, "Order already in this status")

    if new_status not in get_next_statuses(old_status):
        raise HTTPException(
            400,
            f"Invalid status change: {old_status} → {new_status}"
        )

    owner_items = [
        i for i in o.get("items", [])
        if str(i.get("owner_id")) == owner_id
    ]

    stock_reduced = o.get("stock_reduced", False)

    # -------------------------------------------------------
    # REDUCE STOCK ON ACCEPT
    # -------------------------------------------------------
    if old_status == "pending" and new_status == "accepted" and not stock_reduced:
        for item in owner_items:
            await products_collection.update_one(
                {"_id": ObjectId(item["product_id"])},
                {"$inc": {"stock": -item["quantity"]}}
            )

        await orders_collection.update_one(
            {"_id": ObjectId(order_id)},
            {"$set": {"stock_reduced": True}}
        )

    # -------------------------------------------------------
    # RESTORE STOCK ON CANCEL
    # -------------------------------------------------------
    if new_status == "cancelled" and stock_reduced:
        for item in owner_items:
            await products_collection.update_one(
                {"_id": ObjectId(item["product_id"])},
                {"$inc": {"stock": item["quantity"]}}
            )

        await orders_collection.update_one(
            {"_id": ObjectId(order_id)},
            {"$set": {"stock_reduced": False}}
        )

    # -------------------------------------------------------
    # UPDATE STATUS
    # -------------------------------------------------------
    await orders_collection.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"status": new_status}}
    )

    # -------------------------------------------------------
    # USER NOTIFICATION ON CANCEL
    # -------------------------------------------------------
    if new_status == "cancelled":
        await notifications_collection.insert_one({
            "user_id": o["user_id"],
            "order_id": order_id,
            "message": f"Your order {o['order_number']} was cancelled by the shop owner.",
            "timestamp": datetime.utcnow(),
            "read": False
        })

    return {"message": f"Order status updated to {new_status}"}
