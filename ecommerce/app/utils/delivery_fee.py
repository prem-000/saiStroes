GST_PERCENT = 5
BASE_FEE = 25
PER_KM_RATE = 12
PLATFORM_FEE = 10


def calculate_delivery(distance_km: float, subtotal: float):
    if subtotal >= 999:
        return {
            "distance_km": round(distance_km, 2),
            "delivery_fee": 0,
            "gst": 0,
            "platform_fee": 0,
            "total_delivery": 0
        }

    distance_fee = distance_km * PER_KM_RATE
    delivery_fee = BASE_FEE + distance_fee + PLATFORM_FEE
    gst = delivery_fee * (GST_PERCENT / 100)

    total_delivery = round(delivery_fee + gst)

    return {
        "distance_km": round(distance_km, 2),
        "base_fee": BASE_FEE,
        "distance_fee": round(distance_fee, 2),
        "platform_fee": PLATFORM_FEE,
        "gst": round(gst, 2),
        "total_delivery": total_delivery
    }
