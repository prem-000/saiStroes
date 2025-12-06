from bson import ObjectId
from app.models.products import products_collection
from app.utils.serializer import serialize_doc, serialize_docs
from app.utils.file_utils import save_upload_file


# --------------------------------------------------
# CREATE PRODUCT (OWNER)
# --------------------------------------------------
async def create_product(product_data, owner):
    data = product_data.dict()

    # Normalize category
    if data.get("category"):
        data["category"] = data["category"].strip().lower()

    # Ensure images list exists
    data.setdefault("images", [])

    # Always store a usable image field
    data["image"] = (
        data["images"][0] if data["images"] else "/img/default.jpg"
    )

    # Assign owner
    data["owner_id"] = str(owner["_id"])

    result = await products_collection.insert_one(data)
    return str(result.inserted_id)


# --------------------------------------------------
# GET ALL PRODUCTS (ADMIN / USER)
# --------------------------------------------------
async def get_all_products():
    docs = await products_collection.find().to_list(None)
    return serialize_docs(docs)


# --------------------------------------------------
# GET PRODUCT BY ID (USER)
# --------------------------------------------------
async def get_product_by_id(product_id: str):
    doc = await products_collection.find_one({"_id": ObjectId(product_id)})
    return serialize_doc(doc) if doc else None


# --------------------------------------------------
# GET PRODUCTS OF ONE OWNER
# --------------------------------------------------
async def get_products_by_owner(owner_id: str):
    docs = await products_collection.find({"owner_id": str(owner_id)}).to_list(None)
    return serialize_docs(docs)


# --------------------------------------------------
# UPDATE PRODUCT (OWNER ONLY)
# --------------------------------------------------
async def update_product(product_id: str, data, owner_id: str):
    updates = {k: v for k, v in data.dict().items() if v is not None}

    # Normalize category
    if updates.get("category"):
        updates["category"] = updates["category"].strip().lower()

    # If image updated, set it also as primary image
    if updates.get("image"):
        updates["image"] = updates["image"]

    result = await products_collection.update_one(
        {"_id": ObjectId(product_id), "owner_id": str(owner_id)},
        {"$set": updates}
    )

    return result.modified_count > 0


# --------------------------------------------------
# DELETE PRODUCT (OWNER ONLY)
# --------------------------------------------------
async def delete_product(product_id: str, owner_id: str):
    result = await products_collection.delete_one(
        {"_id": ObjectId(product_id), "owner_id": owner_id}
    )
    return result.deleted_count > 0


# --------------------------------------------------
# ADD IMAGE TO PRODUCT
# --------------------------------------------------
async def add_image_to_product(product_id, upload_file, owner_id):
    product = await products_collection.find_one({
        "_id": ObjectId(product_id),
        "owner_id": owner_id
    })

    if not product:
        return False, "Product not found or not yours"

    ok, filename = await save_upload_file(upload_file)
    if not ok:
        return False, filename

    image_url = f"/static/uploads/{filename}"

    await products_collection.update_one(
        {"_id": ObjectId(product_id)},
        {"$push": {"images": image_url}}
    )

    # If product had no primary image, set this as main
    if not product.get("image"):
        await products_collection.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": {"image": image_url}}
        )

    return True, image_url


# --------------------------------------------------
# REPLACE IMAGES
# --------------------------------------------------
async def replace_images(product_id, images, owner_id):
    product = await products_collection.find_one({
        "_id": ObjectId(product_id),
        "owner_id": owner_id
    })

    if not product:
        return False

    await products_collection.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": {"images": images}}
    )

    # Update primary image
    new_primary = images[0] if images else "/img/default.jpg"

    await products_collection.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": {"image": new_primary}}
    )

    return True
