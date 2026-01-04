from datetime import datetime

shop_bank_collection = "shop_bank_details"

def shop_bank_schema(data):
    return {
        "_id": str(data["_id"]),
        "owner_id": data["owner_id"],
        "account_holder": data["account_holder"],
        "account_number": data["account_number"],  # encrypt later
        "ifsc": data["ifsc"],
        "bank_name": data["bank_name"],
        "upi_id": data.get("upi_id"),
        "verified": data.get("verified", False),
        "created_at": data.get("created_at", datetime.utcnow())
    }
