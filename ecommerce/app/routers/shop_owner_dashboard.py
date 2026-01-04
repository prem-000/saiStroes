from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timedelta
from bson import ObjectId
from app.utils.shop_owner_guard import ensure_shop_profile_completed

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
    await ensure_shop_profile_completed(owner_id)

    total_orders = await orders_collection.count_documents({
        "items.owner_id": owner_id,
        "status": {"$ne": "cancelled"}
    })

    total_revenue = 0.0
    total_items_sold = 0
    weekly_revenue = 0.0
    monthly_revenue = 0.0

    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    async for o in orders_collection.find({
        "items.owner_id": owner_id,
        "status": {"$ne": "cancelled"}
    }):

        order_total = 0.0

        for it in o.get("items", []):
            if str(it.get("owner_id")) == owner_id:
                qty = int(it.get("quantity", 0))
                price = float(it.get("price", 0))
                subtotal = qty * price

                order_total += subtotal
                total_items_sold += qty

        total_revenue += order_total

        # ----- DATE HANDLING -----
        created_at = o.get("created_at")
        if isinstance(created_at, str):
            created_at = _parse_iso(created_at)

        if isinstance(created_at, datetime):
            if created_at >= week_ago:
                weekly_revenue += order_total
            if created_at >= month_ago:
                monthly_revenue += order_total

    return {
        "total_orders": total_orders,
        "total_revenue": round(total_revenue, 2),
        "total_items_sold": total_items_sold,
        "weekly_revenue": round(weekly_revenue, 2),
        "monthly_revenue": round(monthly_revenue, 2),
        "monthly_revenue": round(monthly_revenue, 2),
        "note": (
            "Hand cash amounts are shown strictly for analytical purposes only. "
            "They are not credited to the shop owner's account balance."
        )
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

@router.get("/charts")
async def owner_charts(owner=Depends(owner_auth)):
    owner_id = str(owner["_id"])
    await ensure_shop_profile_completed(owner_id)

    today = datetime.utcnow().date()
    days = [(today - timedelta(days=i)) for i in range(6, -1, -1)]

    orders_by_day = {d.strftime("%Y-%m-%d"): 0 for d in days}
    revenue_by_day = {d.strftime("%Y-%m-%d"): 0.0 for d in days}

    status_count = {
        "pending": 0,
        "accepted": 0,
        "packed": 0,
        "shipped": 0,
        "delivered": 0,
        "cancelled": 0
    }

    async for o in orders_collection.find({"items.owner_id": owner_id}):
        status = o.get("status")
        if status in status_count:
            status_count[status] += 1

        created_at = o.get("created_at")
        if isinstance(created_at, str):
            created_at = _parse_iso(created_at)

        if not isinstance(created_at, datetime):
            continue

        day_key = created_at.date().strftime("%Y-%m-%d")
        if day_key not in orders_by_day:
            continue

        order_total = 0.0
        for it in o.get("items", []):
            if str(it.get("owner_id")) == owner_id:
                order_total += float(it.get("price", 0)) * int(it.get("quantity", 0))

        orders_by_day[day_key] += 1
        revenue_by_day[day_key] += order_total

    return {
        "labels": list(orders_by_day.keys()),
        "orders_trend": list(orders_by_day.values()),
        "revenue_trend": [round(v, 2) for v in revenue_by_day.values()],
        "status_distribution": status_count
    }
