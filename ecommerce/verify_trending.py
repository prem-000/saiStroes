import asyncio
import os
from datetime import datetime, timedelta

# Mocking database and imports BEFORE they are used in services
import sys
from unittest.mock import MagicMock

# Create a mock for app.database
mock_db = MagicMock()
sys.modules["app.database"] = mock_db
mock_db.get_collection.return_value = MagicMock()

# Now import the logic
from app.services.user_product_service import _calculate_tags, _calculate_best_seller_score

async def verify_logic():
    print("--- Verifying Badge Logic ---")
    
    # Mock product data
    product_old = {
        "title": "Old Reliable",
        "price": 100,
        "sold_count": 50,
        "created_at": datetime.utcnow() - timedelta(days=60)
    }
    
    product_new = {
        "title": "New Trendy",
        "price": 50,
        "sold_count": 5,
        "created_at": datetime.utcnow() - timedelta(days=2)
    }
    
    # 1. Test Trending Tag
    print("\nCase 1: Trending Tag")
    tags_trending = _calculate_tags(product_new, recent_sales=10)
    print(f"Product: {product_new['title']}, Recent Sales: 10 => Tags: {tags_trending}")
    assert "trending" in tags_trending
    
    tags_not_trending = _calculate_tags(product_old, recent_sales=2)
    print(f"Product: {product_old['title']}, Recent Sales: 2 => Tags: {tags_not_trending}")
    assert "trending" not in tags_not_trending

    # 2. Test Best Seller Refinement
    print("\nCase 2: Best Seller Refinement")
    # Old product with NO recent sales should NOT be best seller anymore in our refined logic (unless it's very recent)
    tags_old_no_sales = _calculate_tags(product_old, recent_sales=0)
    print(f"Product: {product_old['title']} (Old), Recent Sales: 0 => Tags: {tags_old_no_sales}")
    assert "best_seller" not in tags_old_no_sales
    
    # Old product WITH recent sales SHOULD be best seller
    tags_old_with_sales = _calculate_tags(product_old, recent_sales=1)
    print(f"Product: {product_old['title']} (Old), Recent Sales: 1 => Tags: {tags_old_with_sales}")
    assert "best_seller" in tags_old_with_sales

    # 3. Test Best Seller Score (Popularity Score)
    print("\nCase 3: Best Seller Score")
    score_new = _calculate_best_seller_score(product_new, avg_rating=4.5, review_trust=1.0, recent_sales=10)
    score_old = _calculate_best_seller_score(product_old, avg_rating=4.5, review_trust=1.0, recent_sales=0)
    
    print(f"Product: {product_new['title']} Score: {score_new:.2f}")
    print(f"Product: {product_old['title']} Score: {score_old:.2f}")
    
    assert score_new > score_old
    print("SUCCESS: New trendy item has higher score than stagnant old item.")

if __name__ == "__main__":
    asyncio.run(verify_logic())
