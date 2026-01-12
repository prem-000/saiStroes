from bson import ObjectId
from app.database import get_collection
from app.services.product_service import get_product_by_id

cart_collection = get_collection("cart")


# -----------------------
# ADD TO CART
# -----------------------
async def add_to_cart(user_id: str, product_id: str, quantity: int):
    product = await get_product_by_id(product_id)
    if not product:
        return None

    price = product["price"]
    owner_id = product["owner_id"]
    image = product.get("image") or product.get("images", [None])[0]
    title = product.get("title", "")

    existing = await cart_collection.find_one({
        "user_id": user_id,
        "product_id": product_id
    })

    if existing:
        new_quantity = existing["quantity"] + quantity

        await cart_collection.update_one(
            {"_id": existing["_id"]},
            {"$set": {"quantity": new_quantity}}
        )

        return str(existing["_id"])

    result = await cart_collection.insert_one({
        "user_id": user_id,
        "product_id": product_id,
        "title": title,
        "image": image,
        "quantity": quantity,
        "price": price,
        "owner_id": owner_id
    })

    return str(result.inserted_id)


# -----------------------
# GET CART (FULL PRODUCT DATA)
# -----------------------
async def get_cart(user_id: str):
    items = await cart_collection.find({"user_id": user_id}).to_list(200)

    cart_total = 0
    formatted_items = []

    for item in items:
        item_total = item["price"] * item["quantity"]
        cart_total += item_total

        formatted_items.append({
            "cart_item_id": str(item["_id"]),
            "product_id": item["product_id"],
            "title": item.get("title", ""),
            "image": item.get("image", ""),
            "quantity": item["quantity"],
            "price": item["price"],
            "item_total": item_total,
            "owner_id": item.get("owner_id")   # <-- FIX ADDED
        })


    return {
        "items": formatted_items,
        "cart_total": cart_total
    }


# -----------------------
# UPDATE QUANTITY
# -----------------------
async def update_cart_item_quantity(user_id: str, product_id: str, quantity: int):
    if quantity <= 0:
        return await remove_from_cart(user_id, product_id)

    result = await cart_collection.update_one(
        {"user_id": user_id, "product_id": product_id},
        {"$set": {"quantity": quantity}}
    )
    return result.modified_count > 0


# -----------------------
# REMOVE ITEM
# -----------------------
async def remove_from_cart(user_id: str, product_id: str):
    result = await cart_collection.delete_one({
        "user_id": user_id,
        "product_id": product_id
    })
    return result.deleted_count > 0


# -----------------------
# CLEAR CART
# -----------------------
async def clear_cart(user_id: str):
    await cart_collection.delete_many({"user_id": user_id})
    return True
