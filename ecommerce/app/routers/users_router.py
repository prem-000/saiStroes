from fastapi import APIRouter, Depends
from app.utils.oauth2 import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me")
async def get_me(current_user = Depends(get_current_user)):
    return {
        "email": current_user["email"],
        "name": current_user["name"]
    }
