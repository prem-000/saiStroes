import sys
import os
from datetime import datetime

# Add the project directory to sys.path
sys.path.append(os.getcwd())

from ecommerce.app.schemas.order_schema import OrderResponse, OrderCreateResponse

# Test 1: OrderResponse with legacy data (missing payment fields, using delivery_fee instead of delivery, and invalid note)
legacy_order = {
    "order_id": "123",
    "user_id": "user1",
    "items": [
        {
            "product_id": "prod1",
            "title": "Test Product",
            "image": "img.jpg",
            "quantity": 1,
            "price": 100.0,
            "item_total": 100.0,
            "owner_id": "owner1"
        }
    ],
    "cart_total": 100.0,
    "delivery_fee": 10.0,
    "total": 110.0,
    "status": "pending",
    "order_number": "ORD001",
    "created_at": datetime.now(),
    "shop_owner_ids": ["owner1"],
    "note": {"some": "dict"} # Improper data
}

# Simulate service layer fix
if "delivery" not in legacy_order and "delivery_fee" in legacy_order:
    legacy_order["delivery"] = legacy_order["delivery_fee"]

if not isinstance(legacy_order.get("note"), str):
    legacy_order["note"] = ""

try:
    OrderResponse.model_validate(legacy_order)
    print("Test 1 (Legacy Order with invalid Note) Passed!")
except Exception as e:
    print(f"Test 1 Failed: {e}")

# Test 2: OrderCreateResponse with Buy Now data
buy_now_response = {
    "order_id": "456",
    "order_number": "ORD002",
    "total": 150.0,
    "status": "pending"
}
# cart_total, delivery, user_profile are optional in my fix

try:
    OrderCreateResponse.model_validate(buy_now_response)
    print("Test 2 (OrderCreateResponse) Passed!")
except Exception as e:
    print(f"Test 2 Failed: {e}")

# Test 3: Buy Now Item (missing cart_item_id)
buy_now_item = {
    "product_id": "prod2",
    "title": "Buy Now Product",
    "image": "img2.jpg",
    "quantity": 1,
    "price": 40.0,
    "item_total": 40.0,
    "owner_id": "owner2"
}

from ecommerce.app.schemas.order_schema import OrderItem
try:
    OrderItem.model_validate(buy_now_item)
    print("Test 3 (OrderItem without cart_item_id) Passed!")
except Exception as e:
    print(f"Test 3 Failed: {e}")
