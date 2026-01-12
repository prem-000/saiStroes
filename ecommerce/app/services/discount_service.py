from app.database import get_collection

orders_collection = get_collection("orders")

# RULES
MIN_ORDER_VALUE_FLAT = 999.0
DISCOUNT_FLAT = 100.0

MIN_ORDER_VALUE_PERCENT = 1499.0
DISCOUNT_PERCENT = 0.10  # 10%
MAX_PERCENT_DISCOUNT = 300.0

NEW_USER_DISCOUNT_VALUE = 150.0

async def is_new_user(user_id: str) -> bool:
    """
    Check if user has 0 completed/delivered orders.
    """
    count = await orders_collection.count_documents({
        "user_id": user_id, 
        "status": "delivered"
    })
    return count == 0

async def calculate_offers(user_id: str, cart_total: float, claim_new_user: bool = False) -> dict:
    """
    Calculate applicable discounts.
    Returns:
    {
        "discount_amount": float,
        "final_total": float,
        "applied_coupon": str | None,
        "message": str
    }
    """
    discount = 0.0
    applied_coupon = None
    message = ""

    # 1. NEW USER OFFER (Highest Priority if claimed)
    if claim_new_user:
        if await is_new_user(user_id):
            if cart_total >= 250:
                discount = NEW_USER_DISCOUNT_VALUE
                applied_coupon = "NEWUSER150"
                message = f"Top Deal! Flat ₹{int(NEW_USER_DISCOUNT_VALUE)} OFF on first order."
            else:
                message = "New User offer requires a minimum order of ₹250."
        else:
            message = "New User offer is not applicable (You have previous orders)."

    # 2. IF NO COUPON, CHECK AUTO-APPLY OFFERS (Best Value Logic)
    if not applied_coupon:
        
        # Option A: 10% OFF > 1499
        if cart_total >= MIN_ORDER_VALUE_PERCENT:
            potential_discount = min(cart_total * DISCOUNT_PERCENT, MAX_PERCENT_DISCOUNT)
            
            if potential_discount > discount:
                discount = potential_discount
                applied_coupon = "BIGSAVE10"
                message = f"10% OFF applied (Max ₹{int(MAX_PERCENT_DISCOUNT)})"

        # Option B: Flat 100 OFF > 999
        # Only apply if Option A didn't trigger or gave less discount (unlikely given math, but safe)
        if cart_total >= MIN_ORDER_VALUE_FLAT and discount == 0:
             discount = DISCOUNT_FLAT
             applied_coupon = "FLAT100"
             message = f"Flat ₹{int(DISCOUNT_FLAT)} OFF applied"

    # Cap discount to cart total (No negative total)
    discount = min(discount, cart_total)
    
    return {
        "discount_amount": round(discount, 2),
        "applied_coupon": applied_coupon,
        "message": message
    }
