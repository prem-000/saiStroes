from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from app.database import get_collection
from app.utils.oauth2 import get_current_user
from app.services.product_service import get_product_by_id

wishlist_collection = get_collection("wishlist")

router = APIRouter(prefix="/wishlist", tags=["Wishlist"])

# =====================================================
# ADD TO WISHLIST
# =====================================================
@router.post("/add/{product_id}")
async def add_to_wishlist(product_id: str, user=Depends(get_current_user)):
    user_id = str(user["_id"])

    product = await get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    exists = await wishlist_collection.find_one({
        "user_id": user_id,
        "product_id": product_id
    })

    if exists:
        return {"message": "Already in wishlist"}

    await wishlist_collection.insert_one({
        "user_id": user_id,
        "product_id": product_id,
        "created_at": datetime.utcnow().isoformat()
    })

    return {"message": "Added to wishlist"}


# =====================================================
# TOGGLE WISHLIST (ADD / REMOVE IN ONE ROUTE)
# =====================================================
@router.post("/toggle/{product_id}")
async def toggle_wishlist(product_id: str, user=Depends(get_current_user)):
    user_id = str(user["_id"])

    exists = await wishlist_collection.find_one({
        "user_id": user_id,
        "product_id": product_id
    })

    if exists:
        await wishlist_collection.delete_one({"_id": exists["_id"]})
        return {"status": "removed"}

    await wishlist_collection.insert_one({
        "user_id": user_id,
        "product_id": product_id,
        "created_at": datetime.utcnow().isoformat()
    })

    return {"status": "added"}


# =====================================================
# GET FULL WISHLIST (PRODUCT DETAILS INCLUDED)
# =====================================================
@router.get("/")
async def list_wishlist(user=Depends(get_current_user)):
    user_id = str(user["_id"])

    items = await wishlist_collection \
        .find({"user_id": user_id}) \
        .sort("created_at", -1) \
        .to_list(200)

    result = []
    for w in items:
        product = await get_product_by_id(w["product_id"])

        if product:  # product still exists
            result.append({
                "product_id": w["product_id"],
                "title": product["title"],
                "price": product["price"],
                "image": product.get("image") or None,
                "added_at": w.get("created_at")
            })

    return result


# =====================================================
# REMOVE SINGLE ITEM
# =====================================================
@router.delete("/remove/{product_id}")
async def remove_wishlist(product_id: str, user=Depends(get_current_user)):
    user_id = str(user["_id"])

    res = await wishlist_collection.delete_one({
        "user_id": user_id,
        "product_id": product_id
    })

    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Wishlist item not found")

    return {"message": "Removed from wishlist"}


# =====================================================
# CLEAR ALL ITEMS
# =====================================================
@router.delete("/clear")
async def clear_wishlist(user=Depends(get_current_user)):
    user_id = str(user["_id"])
    await wishlist_collection.delete_many({"user_id": user_id})
    return {"message": "Wishlist cleared"}
