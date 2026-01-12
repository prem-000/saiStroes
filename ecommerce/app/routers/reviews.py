from fastapi import APIRouter, Depends, HTTPException
from app.database import get_collection
from app.models.review import ReviewCreate, ReviewModel
from app.utils.oauth2 import get_current_user
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/reviews", tags=["Reviews"])
reviews_collection = get_collection("reviews")
profiles = get_collection("user_profiles")

@router.post("/")
async def create_review(payload: ReviewCreate, user=Depends(get_current_user)):
    user_id = str(user["_id"])
    
    # Get username from profile if possible, else generic
    profile = await profiles.find_one({"user_id": user_id})
    username = profile.get("name", "User") if profile else "User"

    # Check if already reviewed? (Optional limitation)
    existing = await reviews_collection.find_one({
        "user_id": user_id,
        "product_id": payload.product_id
    })
    if existing:
        raise HTTPException(400, "You have already reviewed this product")

    review_doc = ReviewModel(
        product_id=payload.product_id,
        user_id=user_id,
        username=username,
        rating=payload.rating,
        comment=payload.comment,
        created_at=datetime.utcnow()
    )

    result = await reviews_collection.insert_one(review_doc.dict())
    return {"message": "Review submitted", "id": str(result.inserted_id)}


@router.get("/{product_id}")
async def get_product_reviews(product_id: str):
    reviews = []
    async for r in reviews_collection.find({"product_id": product_id}).sort("created_at", -1):
        r["id"] = str(r["_id"])
        r.pop("_id")
        reviews.append(r)
    return reviews
