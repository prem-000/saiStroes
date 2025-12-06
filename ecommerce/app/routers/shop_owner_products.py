from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from app.database import get_collection
from app.schemas.product_schema import ProductCreate, ProductUpdate
from app.utils.shop_owner_authenticate import owner_auth
from app.utils.serializer import serialize_docs

products_collection = get_collection("products")

router = APIRouter(prefix="/shop-owner/products", tags=["Shop Owner Products"])


# ----------------------------------------------------
# CREATE PRODUCT  ✔ FIXED category + image
# ----------------------------------------------------
@router.post("/create")
async def create_product_for_owner(product: ProductCreate, owner=Depends(owner_auth)):

    data = product.dict()

    # Normalize category
    if data.get("category"):
        data["category"] = data["category"].strip().lower()

    # Always store full images list
    images = data.get("images", [])
    data["images"] = images

    # Primary image for UI
    data["image"] = images[0] if len(images) > 0 else "/img/default.jpg"

    # Owner
    data["owner_id"] = str(owner["_id"])


    # Assign owner
    
    result = await products_collection.insert_one(data)

    return {
        "message": "Product created successfully",
        "product_id": str(result.inserted_id)
    }


# ----------------------------------------------------
# GET MY PRODUCTS
# ----------------------------------------------------
@router.get("/my")
async def get_my_products(owner=Depends(owner_auth)):
    owner_id = str(owner["_id"])
    products = await products_collection.find({"owner_id": owner_id}).to_list(None)
    return serialize_docs(products)


# ----------------------------------------------------
# UPDATE PRODUCT ✔ FIXED category + image
# ----------------------------------------------------
@router.put("/{product_id}")
async def update_owner_product(product_id: str, update_data: ProductUpdate, owner=Depends(owner_auth)):
    owner_id = str(owner["_id"])

    product = await products_collection.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(404, "Product not found")

    if str(product["owner_id"]) != owner_id:
        raise HTTPException(403, "Not your product")

    updates = {k: v for k, v in update_data.dict().items() if v is not None}

    if updates.get("category"):
        updates["category"] = updates["category"].strip().lower()

    if updates.get("image"):
        updates["image"] = updates["image"]

    await products_collection.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": updates}
    )

    return {"message": "Product updated successfully"}


# --------------------------------------------------s--
# DELETE PRODUCT
# ----------------------------------------------------
@router.delete("/{product_id}")
async def delete_owner_product(product_id: str, owner=Depends(owner_auth)):
    owner_id = str(owner["_id"])

    product = await products_collection.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(404, "Product not found")

    if str(product["owner_id"]) != owner_id:
        raise HTTPException(403, "Not your product")

    await products_collection.delete_one({"_id": ObjectId(product_id)})

    return {"message": "Product deleted successfully"}
