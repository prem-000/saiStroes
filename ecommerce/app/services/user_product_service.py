from bson import ObjectId
from app.database import get_collection
from app.utils.serializer import serialize_doc

products_collection = get_collection("products")


# ------------------------------------------------------
# GET ALL PUBLIC PRODUCTS (HOME PAGE)
# ------------------------------------------------------
async def get_all_user_products():
    products = await products_collection.find(
        {},
        {
            "_id": 1,
            "title": 1,
            "price": 1,
            "description": 1,
            "stock": 1,
            "images": 1
        }
    ).to_list(None)

    result = []
    for p in products:
        p = serialize_doc(p)   # <-- VERY IMPORTANT
        p["image"] = p.get("images", [None])[0]
        result.append(p)

    return result


# ------------------------------------------------------
# GET SINGLE PUBLIC PRODUCT
# ------------------------------------------------------
async def get_single_user_product(product_id: str):
    # Prevent crash if ID = "undefined"
    if product_id == "undefined":
        return None

    product = await products_collection.find_one(
        {"_id": ObjectId(product_id)},
        {
            "_id": 1,
            "title": 1,
            "price": 1,
            "description": 1,
            "stock": 1,
            "images": 1
        }
    )

    if not product:
        return None

    product = serialize_doc(product)  # <-- VERY IMPORTANT
    product["image"] = product.get("images", [None])[0]

    return product
