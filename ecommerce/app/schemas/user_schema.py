from pydantic import BaseModel, EmailStr, Field

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=200)

class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr

class UserLogin(BaseModel):
    email: EmailStr
    password: str

