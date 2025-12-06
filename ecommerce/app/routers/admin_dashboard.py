from fastapi import APIRouter, Depends
from datetime import datetime, timedelta

from app.utils.admin_authenticate import admin_auth
from app.models.user import users_collection
from app.models.shop_owner import shop_owners_collection
from app.models.products import products_collection
from app.models.order import orders_collection

router = APIRouter(prefix="/admin/dashboard", tags=["Admin Dashboard"])


# -----------------------------
# 1. TOTAL COUNTS
# -----------------------------
@router.get("/stats")
async def get_admin_stats(admin=Depends(admin_auth)):
    total_users = await users_collection.count_documents({})
    total_owners = await shop_owners_collection.count_documents({})
    total_products = await products_collection.count_documents({})
    total_orders = await orders_collection.count_documents({})

    return {
        "total_users": total_users,
        "total_shop_owners": total_owners,
        "total_products": total_products,
        "total_orders": total_orders
    }


# -----------------------------
# 2. DAILY / WEEKLY / MONTHLY ORDER STATS
# -----------------------------
@router.get("/order-stats")
async def order_stats(admin=Depends(admin_auth)):
    now = datetime.utcnow()

    day_ago = now - timedelta(days=1)
    week_ago = now - timedelta(weeks=1)
    month_ago = now - timedelta(days=30)

    daily = await orders_collection.count_documents({"created_at": {"$gte": day_ago.isoformat()}})
    weekly = await orders_collection.count_documents({"created_at": {"$gte": week_ago.isoformat()}})
    monthly = await orders_collection.count_documents({"created_at": {"$gte": month_ago.isoformat()}})

    return {
        "daily_orders": daily,
        "weekly_orders": weekly,
        "monthly_orders": monthly
    }


# -----------------------------
# 3. RECENT 10 ORDERS
# -----------------------------
@router.get("/recent-orders")
async def get_recent_orders(admin=Depends(admin_auth)):
    orders = []

    async for o in orders_collection.find().sort("created_at", -1).limit(10):
        o["id"] = str(o["_id"])
        del o["_id"]
        orders.append(o)

    return orders
