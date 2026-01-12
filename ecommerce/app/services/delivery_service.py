from fastapi import HTTPException

# ---------------------------------------------------------
# CENTRALIZED DELIVERY CONFIGURATION
# ---------------------------------------------------------
BASE_FEE = 30.0
PER_KM_RATE = 8.0
MAX_DISTANCE_KM = 20.0

# RULES
FREE_DELIVERY_THRESHOLD = 799.0  # Cart > 799 = Free
FREE_DISTANCE_KM = 3.0           # Dist <= 3km = Free
DISCOUNT_DISTANCE_KM = 5.0       # Dist <= 5km = -30 OFF
DISTANCE_DISCOUNT_AMOUNT = 30.0

def calculate_delivery_cost(distance_km: float, cart_total: float) -> dict:
    """
    Calculates delivery fee based on distance and cart total.
    Returns:
    {
        "fee": float,
        "is_free": bool,
        "breakdown": str,
        "original_fee": float (optional)
    }
    """
    
    # 1. Edge Rule: Max Distance
    if distance_km > MAX_DISTANCE_KM:
        raise HTTPException(
            status_code=400, 
            detail=f"We currently do not deliver beyond {int(MAX_DISTANCE_KM)}km. Your distance: {round(distance_km, 1)}km"
        )

    # 2. Rule: Free Delivery (Cart Value)
    if cart_total > FREE_DELIVERY_THRESHOLD:
        return {
            "fee": 0.0,
            "is_free": True,
            "breakdown": "Free Delivery (Order > ₹799)"
        }

    # 3. Rule: Free Delivery (Distance)
    if distance_km <= FREE_DISTANCE_KM:
        return {
            "fee": 0.0,
            "is_free": True,
            "breakdown": f"Free Delivery (Within {int(FREE_DISTANCE_KM)}km)"
        }

    # 4. Standard Calc
    # delivery_fee = base_fee + (distance_km * per_km_rate)
    raw_fee = BASE_FEE + (distance_km * PER_KM_RATE)
    
    # 5. Rule: Distance Discount
    if distance_km <= DISCOUNT_DISTANCE_KM:
        discounted_fee = max(0, raw_fee - DISTANCE_DISCOUNT_AMOUNT)
        return {
            "fee": round(discounted_fee, 2),
            "is_free": False,
            "breakdown": f"₹{round(raw_fee, 2)} - ₹{DISTANCE_DISCOUNT_AMOUNT} (Near Distance Offer)"
        }

    # Standard
    return {
        "fee": round(raw_fee, 2),
        "is_free": False,
        "breakdown": f"Base ₹{BASE_FEE} + (₹{PER_KM_RATE} × {round(distance_km, 1)}km)"
    }
