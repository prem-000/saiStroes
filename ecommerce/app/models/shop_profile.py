from datetime import datetime

shop_profile_collection = "shop_profiles"

def shop_profile_schema(data):
    return {
        "_id": str(data["_id"]),
        "owner_id": data["owner_id"],
        "shop_name": data["shop_name"],
        "category": data["category"],
        "phone": data["phone"],
        "address": data["address"],
        "city": data["city"],
        "pincode": data["pincode"],
        "latitude": data["latitude"],
        "longitude": data["longitude"],
        "is_verified": data.get("is_verified", False),
        "created_at": data.get("created_at", datetime.utcnow())
    }
