from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.services.shop_owner_service import find_shop_owner_by_id
from app.config import settings

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM

bearer = HTTPBearer()

async def owner_auth(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    token = credentials.credentials

    try:
        # Decode JWT token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        # Extract owner_id from token
        owner_id = payload.get("sub")
        if not owner_id:
            raise HTTPException(status_code=401, detail="Invalid token")

        # Fetch owner by ID
        owner = await find_shop_owner_by_id(owner_id)
        if not owner:
            raise HTTPException(status_code=401, detail="Shop owner not found")

        return owner   # Return the full owner document

    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalid")
