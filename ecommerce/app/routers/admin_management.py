from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

from app.utils.admin_authenticate import admin_auth
from app.database import get_collection

users_collection = get_collection("users")
shop_owners_collection = get_collection("shop_owners")
products_collection = get_collection("products")
orders_collection = get_collection("orders")  # used optionally for cleanup

router = APIRouter(prefix="/admin/manage", tags=["Admin Management"])


@router.delete("/user/{user_id}")
async def admin_delete_user(user_id: str, admin=Depends(admin_auth)):
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user id")

    res = await users_collection.delete_one({"_id": oid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    # optional: remove carts/wishlist/orders related to this user (uncomment if wanted)
    # await get_collection("cart").delete_many({"user_id": user_id})
    # await get_collection("wishlist").delete_many({"user_id": user_id})
    return {"message": "User deleted"}


@router.delete("/owner/{owner_id}")
async def admin_delete_owner(owner_id: str, admin=Depends(admin_auth)):
    try:
        oid = ObjectId(owner_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid owner id")

    res = await shop_owners_collection.delete_one({"_id": oid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Owner not found")

    # optional: set owner_id on products to None or delete products
    await products_collection.update_many({"owner_id": owner_id}, {"$set": {"owner_removed": True}})
    return {"message": "Shop owner deleted (products flagged)"}


@router.delete("/product/{product_id}")
async def admin_delete_product(product_id: str, admin=Depends(admin_auth)):
    try:
        oid = ObjectId(product_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid product id")

    res = await products_collection.delete_one({"_id": oid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}
