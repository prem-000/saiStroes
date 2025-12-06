from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timedelta
from bson import ObjectId

from app.utils.shop_owner_authenticate import owner_auth
from app.models.order import orders_collection
from app.models.products import products_collection

router = APIRouter(prefix="/shop-owner/dashboard", tags=["Shop Owner Dashboard"])


def _parse_iso(dt_str: str):
    try:
        return datetime.fromisoformat(dt_str)
    except Exception:
        return None


@router.get("/summary")
async def owner_summary(owner=Depends(owner_auth)):
    owner_id = str(owner["_id"])

    total_orders = await orders_collection.count_documents({
        "items.owner_id": owner_id,
        "status": {"$ne": "cancelled"}
    })

    total_revenue = 0.0
    total_items_sold = 0

    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    weekly_revenue = 0.0
    monthly_revenue = 0.0

    async for o in orders_collection.find({
        "items.owner_id": owner_id,
        "status": {"$ne": "cancelled"}
    }):

        for it in o.get("items", []):
            if str(it.get("owner_id")) == owner_id:
                qty = int(it.get("quantity", 0))
                price = float(it.get("price", 0))
                subtotal = qty * price

                total_revenue += subtotal
                total_items_sold += qty

        # -------------------------
        # FIXED DATE HANDLING
        # -------------------------
        created_at = o.get("created_at")

        if isinstance(created_at, str):
            created_at = _parse_iso(created_at)

        if isinstance(created_at, datetime):
            if created_at >= week_ago:
                weekly_revenue += subtotal

            if created_at >= month_ago:
                monthly_revenue += subtotal

    return {
        "total_orders": total_orders,
        "total_revenue": round(total_revenue, 2),
        "total_items_sold": total_items_sold,
        "weekly_revenue": round(weekly_revenue, 2),
        "monthly_revenue": round(monthly_revenue, 2),
    }



@router.get("/orders")
async def owner_orders(owner=Depends(owner_auth), limit: int = 50):
    owner_id = str(owner["_id"])
    orders = []
    async for o in orders_collection.find({"shop_owner_ids": owner_id}).sort("created_at", -1).limit(limit):
        # filter order items to just this owner
        items = [it for it in o.get("items", []) if str(it.get("owner_id")) == owner_id]
        o["items"] = items
        o["id"] = str(o["_id"])
        del o["_id"]
        orders.append(o)
    return orders
