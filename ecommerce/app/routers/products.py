from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.schemas.product_schema import ProductCreate, ProductUpdate
from app.utils.shop_owner_authenticate import owner_auth
from app.utils.admin_authenticate import admin_auth
from app.services.product_service import (
    create_product,
    get_all_products,
    get_products_by_owner,
    get_product_by_id,
    update_product,
    delete_product,
    add_image_to_product,
    replace_images
)


router = APIRouter(prefix="/products", tags=["Products"])


# ---------------------------------------------------
# SHOP OWNER — CREATE PRODUCT
# ---------------------------------------------------
@router.post("/create")
async def create_new_product(product: ProductCreate, owner=Depends(owner_auth)):
    owner_id = str(owner["_id"])
    product_id = await create_product(product, owner_id)
    return {"message": "Product created", "product_id": product_id}


# ---------------------------------------------------
# SHOP OWNER — LIST OWN PRODUCTS
# ---------------------------------------------------
@router.get("/my")
async def list_my_products(owner=Depends(owner_auth)):
    owner_id = str(owner["_id"])
    return await get_products_by_owner(owner_id)


# ---------------------------------------------------
# ADMIN — LIST ALL PRODUCTS
# ---------------------------------------------------
@router.get("/all")
async def admin_all_products(admin=Depends(admin_auth)):
    return await get_all_products()


# ---------------------------------------------------
# PUBLIC — GET PRODUCT BY ID
# ---------------------------------------------------
@router.get("/{product_id}")
async def get_single_product(product_id: str):
    product = await get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


# ---------------------------------------------------
# OWNER — UPDATE PRODUCT
# ---------------------------------------------------
@router.put("/{product_id}")
async def update_my_product(
    product_id: str,
    product_data: ProductUpdate,
    owner=Depends(owner_auth)
):
    owner_id = str(owner["_id"])

    updated = await update_product(product_id, product_data, owner_id)
    if not updated:
        raise HTTPException(status_code=403, detail="You cannot update this product")

    return {"message": "Product updated"}


# ---------------------------------------------------
# OWNER — DELETE PRODUCT
# ---------------------------------------------------
@router.delete("/{product_id}")
async def delete_my_product(product_id: str, owner=Depends(owner_auth)):
    owner_id = str(owner["_id"])

    deleted = await delete_product(product_id, owner_id)
    if not deleted:
        raise HTTPException(status_code=403, detail="You cannot delete this product")

    return {"message": "Product deleted"}


# ---------------------------------------------------
# OWNER — UPLOAD IMAGE
# ---------------------------------------------------
@router.post("/{product_id}/upload-image")
async def upload_product_image(
    product_id: str,
    file: UploadFile = File(...),
    owner=Depends(owner_auth)
):
    owner_id = str(owner["_id"])

    ok, result = await add_image_to_product(product_id, file, owner_id)
    if not ok:
        raise HTTPException(status_code=400, detail=result)

    return {"message": "Image uploaded", "url": result}


# ---------------------------------------------------
# OWNER — REPLACE ALL IMAGES
# ---------------------------------------------------
@router.put("/{product_id}/images")
async def replace_product_images(product_id: str, payload: dict, owner=Depends(owner_auth)):
    owner_id = str(owner["_id"])
    images = payload.get("images", [])

    if not isinstance(images, list):
        raise HTTPException(status_code=400, detail="Images must be a list")

    ok = await replace_images(product_id, images, owner_id)
    if not ok:
        raise HTTPException(status_code=403, detail="You cannot replace images")

    return {"message": "Images replaced successfully"}
