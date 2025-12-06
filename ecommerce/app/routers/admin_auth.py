from fastapi import APIRouter, HTTPException
from jose import jwt
from datetime import datetime, timedelta

from app.config import settings
from app.schemas.admin_schema import AdminCreate, AdminLogin
from app.services.admin_service import create_admin, find_admin_by_email
from app.utils.hashing import Hash


router = APIRouter(prefix="/admin", tags=["Admin Authentication"])

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM


@router.post("/register")
async def register_admin(admin: AdminCreate):
    existing = await find_admin_by_email(admin.email)
    if existing:
        raise HTTPException(status_code=400, detail="Admin email already exists")

    admin_id = await create_admin(admin)
    return {"admin_id": admin_id, "message": "Admin registered"}


@router.post("/login")
async def login_admin(login: AdminLogin):
    admin = await find_admin_by_email(login.email)
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")

    # FIXED — use verify_password(
    if not Hash.verify(login.password, admin["password"]):
        raise HTTPException(status_code=401, detail="Incorrect password")

    token = jwt.encode(
        {
            "sub": admin["email"],
            "role": "admin",
            "exp": datetime.utcnow() + timedelta(hours=12)
        },
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }
