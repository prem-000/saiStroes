from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Depends, HTTPException
from jose import jwt, JWTError
from app.config import settings
from app.services.admin_service import find_admin_by_email

security = HTTPBearer()

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")

        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")

        admin = await find_admin_by_email(email)

        if not admin:
            raise HTTPException(status_code=403, detail="Admin not found")

        return admin

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid admin token")
