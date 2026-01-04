
from app.database import get_collection

providers = get_collection("delivery_providers")

async def get_delivery_charge(provider_id: str):
    provider = await providers.find_one({"_id": provider_id, "active": True})
    if not provider:
        raise Exception("Delivery provider unavailable")

    if provider["pricing_type"] == "fixed":
        return provider["base_fee"]

    # ekart / api-based → decided later
    return 0
