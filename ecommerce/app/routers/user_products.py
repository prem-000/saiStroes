from fastapi import APIRouter, HTTPException
from app.services.user_product_service import (
    get_all_user_products,
    get_single_user_product,
     get_recommended_user_products  
)

router = APIRouter(prefix="/user/products", tags=["User Products"])


@router.get("/")
async def public_list_products():
    return await get_all_user_products()


@router.get("/{product_id}")
async def public_get_product(product_id: str):
    product = await get_single_user_product(product_id)
    if not product:
        raise HTTPException(404, "Product not found")
    return product

@router.get("/{product_id}/recommendations")
async def public_get_recommendations(product_id: str):
    return await get_recommended_user_products(product_id)
