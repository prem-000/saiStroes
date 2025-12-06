from fastapi import APIRouter, Depends, HTTPException
from app.utils.oauth2 import get_current_user
from app.services.cart_service import (
    add_to_cart, get_cart, remove_from_cart, clear_cart
)

router = APIRouter(prefix="/cart", tags=["Cart"])


from fastapi import Query

@router.post("/add")
async def add_item(
    product_id: str = Query(...),
    quantity: int = Query(1),
    user=Depends(get_current_user)
):

    user_id = str(user.get("_id") or user.get("id"))


    cart_item = await add_to_cart(user_id, product_id, quantity)

    if cart_item is None:
        raise HTTPException(status_code=404, detail="Product not found")

    return {"message": "Added to cart", "cart_item_id": cart_item}



@router.get("/")
async def get_my_cart(user=Depends(get_current_user)):
    user_id = str(user["_id"])
    return await get_cart(user_id)


@router.delete("/remove/{product_id}")
async def remove_item(product_id: str, user=Depends(get_current_user)):
    user_id = str(user["_id"])
    removed = await remove_from_cart(user_id, product_id)

    if not removed:
        raise HTTPException(status_code=404, detail="Item not found in cart")

    return {"message": "Item removed"}


@router.delete("/clear")
async def clear_my_cart(user=Depends(get_current_user)):
    user_id = str(user["_id"])
    await clear_cart(user_id)
    return {"message": "Cart cleared"}
