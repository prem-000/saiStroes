from fastapi import APIRouter
from app.database import db

router = APIRouter(prefix="/test", tags=["Test"])

@test_router_post := router.post("/add")
async def add_test_data():
    data = {"name": "test_user", "status": "connected"}
    result = await db["testing"].insert_one(data)
    return {"inserted_id": str(result.inserted_id)}
