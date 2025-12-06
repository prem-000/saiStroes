from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime

from app.models.notification import notifications_collection
from app.utils.oauth2 import get_current_user
from app.utils.shop_owner_authenticate import owner_auth

router = APIRouter(prefix="/notifications", tags=["Notifications"])


# Create a notification (admin/system) — target: user or owner
@router.post("/create")
async def admin_create_notification(payload: dict, admin=Depends(__import__("app.utils.admin_authenticate", fromlist=["admin_auth"]).admin_auth)):
    """
    payload example:
    {
      "target_type": "user" | "owner",
      "target_id": "<id>",
      "title": "New policy",
      "body": "We changed ...",
      "meta": {...}   # optional
    }
    """
    required = ("target_type", "target_id", "title", "body")
    for k in required:
        if k not in payload:
            raise HTTPException(status_code=400, detail=f"Missing {k}")

    doc = {
        "target_type": payload["target_type"],
        "target_id": payload["target_id"],
        "title": payload["title"],
        "body": payload["body"],
        "meta": payload.get("meta", {}),
        "read": False,
        "created_at": datetime.utcnow().isoformat()
    }
    await notifications_collection.insert_one(doc)
    return {"message": "Notification created"}


# User: list notifications
@router.get("/me")
async def my_notifications(user=Depends(get_current_user)):
    user_id = str(user["_id"])
    items = await notifications_collection.find({"target_type": "user", "target_id": user_id}).sort("created_at", -1).to_list(200)
    return items


# Owner: list notifications
@router.get("/owner/me")
async def owner_notifications(owner=Depends(owner_auth)):
    owner_id = str(owner["_id"])
    items = await notifications_collection.find({"target_type": "owner", "target_id": owner_id}).sort("created_at", -1).to_list(200)
    return items


# Mark notification read
@router.put("/mark-read/{notification_id}")
async def mark_read(notification_id: str, user=Depends(get_current_user)):
    res = await notifications_collection.update_one({"_id": __import__("bson").ObjectId(notification_id)}, {"$set": {"read": True}})
    if res.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Marked read"}
