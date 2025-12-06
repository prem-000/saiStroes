from pydantic import BaseModel, EmailStr

class ShopOwnerCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class ShopOwnerLogin(BaseModel):
    email: EmailStr
    password: str
