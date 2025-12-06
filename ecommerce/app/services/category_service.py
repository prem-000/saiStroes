from bson import ObjectId
from app.models.products import products_collection
from app.utils.serializer import serialize_doc

# ----------------------------------------------
# RETURN UNIQUE, CLEAN, NORMALIZED CATEGORY LIST
# ----------------------------------------------
async def get_all_categories():
    categories = set()

    async for p in products_collection.find():
        if p.get("category"):
            normalized = p["category"].strip().lower()
            categories.add(normalized)

    return list(categories)


# ----------------------------------------------
# FILTER PRODUCTS BY CATEGORY
# ----------------------------------------------
async def get_products_by_category(category_name: str):
    target = category_name.strip().lower()

    products = await products_collection.find(
        {"category": target},
        {
            "_id": 1,
            "title": 1,
            "price": 1,
            "description": 1,
            "stock": 1,
            "images": 1,
            "category": 1
        }
    ).to_list(None)

    result = []
    for p in products:
        p = serialize_doc(p)                     # <-- FIX: convert _id → id
        p["image"] = p.get("images", [None])[0]  # <-- FIX: get first image
        result.append(p)

    return result
