from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer
from jose import jwt, JWTError
from app.config import settings


from app.services.shop_owner_service import find_shop_owner_by_email

security = HTTPBearer()

def admin_auth(credentials=Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Not authorized as admin")
        return payload
    except JWTError:
        raise HTTPException(status_code=403, detail="Invalid or expired token")
