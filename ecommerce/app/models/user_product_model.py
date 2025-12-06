from bson import ObjectId

def product_to_user_view(product: dict):
    return {
        "id": str(product["_id"]),
        "title": product.get("title", ""),
        "description": product.get("description", ""),
        "price": product.get("price", 0),
        "stock": product.get("stock", 0),
        "image": product.get("image", ""),
        "owner_id": str(product.get("owner_id", ""))
    }
