from fastapi import APIRouter
from app.services.category_service import (
    get_all_categories,
    get_products_by_category
)

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("/")
async def list_categories():
    return await get_all_categories()


@router.get("/{category_name}")
async def products_in_category(category_name: str):
    return await get_products_by_category(category_name)
