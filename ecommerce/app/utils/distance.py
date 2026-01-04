import math

def distance_km(a: dict, b: dict) -> float:
    R = 6371
    dlat = math.radians(b["lat"] - a["lat"])
    dlon = math.radians(b["lng"] - a["lng"])

    x = (
        math.sin(dlat / 2) ** 2 +
        math.cos(math.radians(a["lat"])) *
        math.cos(math.radians(b["lat"])) *
        math.sin(dlon / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(x), math.sqrt(1 - x))
