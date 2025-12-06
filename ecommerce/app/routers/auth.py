from fastapi import APIRouter, HTTPException
from fastapi import Depends

from app.schemas.user_schema import UserCreate, UserResponse, UserLogin
from app.services.user_service import create_user, find_user_by_email
from app.utils.hashing import Hash
from app.utils.jwt_handler import create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])


# ---------------------------------------------------
# REGISTER USER
# ---------------------------------------------------
@router.post("/register", response_model=UserResponse)
async def register_user(user: UserCreate):

    # Check if user already exists
    existing_user = await find_user_by_email(user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create the user
    user_id = await create_user(user)

    return {
        "id": user_id,
        "name": user.name,
        "email": user.email
    }


# ---------------------------------------------------
# LOGIN USER
# ---------------------------------------------------
@router.post("/login")
async def login_user(user_credentials: UserLogin):

    user = await find_user_by_email(user_credentials.email)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid Credentials")

    # Blocked user check
    if user.get("blocked", False) is True:
        raise HTTPException(status_code=403, detail="User account is blocked by admin")

    # Verify password
    if not Hash.verify(user_credentials.password, user["password"]):
        raise HTTPException(status_code=400, detail="Invalid Credentials")

    # Generate JWT
    access_token = create_access_token({"sub": user["email"]})

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
