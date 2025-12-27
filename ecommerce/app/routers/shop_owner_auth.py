from fastapi import APIRouter, HTTPException
from jose import jwt
from datetime import datetime, timedelta
from app.schemas.shop_owner_schema import ShopOwnerCreate, ShopOwnerLogin
from app.utils.hashing import Hash
from app.config import settings
from app.services.shop_owner_service import (
    create_shop_owner,
    find_shop_owner_by_email
)
from app.utils.email_validator import validate_gmail

router = APIRouter(prefix="/shop-owner", tags=["Shop Owner"])

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM


@router.post("/register")
async def register_shop_owner(owner: ShopOwnerCreate):

    validate_gmail(owner.email)   # 🔥 SAME RULE

    existing_owner = await find_shop_owner_by_email(owner.email)
    if existing_owner:
        raise HTTPException(status_code=400, detail="Email already registered")

    owner_id = await create_shop_owner(owner)

    return {
        "id": owner_id,
        "message": "Shop owner registered successfully"
    }


@router.post("/login")
async def login_shop_owner(login: ShopOwnerLogin):

    validate_gmail(login.email)   # 🔥 SAME RULE

    owner = await find_shop_owner_by_email(login.email)
    if not owner:
        raise HTTPException(status_code=404, detail="Shop owner not found")

    if not Hash.verify(login.password, owner["password"]):
        raise HTTPException(status_code=401, detail="Incorrect password")

    token = jwt.encode(
        {
            "sub": str(owner["_id"]),
            "role": "shop_owner",
            "exp": datetime.utcnow() + timedelta(hours=24),
        },
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "owner_id": str(owner["_id"])
    }
