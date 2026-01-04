def apply_offers(
    *,
    cart_total: int,
    delivery_fee: int,
    is_first_order: bool,
    coupon: dict | None = None
):
    item_discount = 0
    delivery_discount = 0

    # First order → 10% up to ₹100
    if is_first_order:
        item_discount += min(100, int(cart_total * 0.10))

    # Cart slabs
    if cart_total >= 599:
        delivery_discount = delivery_fee
    elif cart_total >= 99:
        delivery_discount = int(delivery_fee * 0.5)

    # Coupon (optional)
    if coupon:
        if coupon["type"] == "flat":
            item_discount += coupon["value"]
        elif coupon["type"] == "percent":
            item_discount += int(cart_total * coupon["value"] / 100)

    return {
        "item_discount": item_discount,
        "delivery_discount": delivery_discount
    }
