import random
from datetime import datetime, timedelta
from bson import ObjectId
from app.database import get_collection
from app.utils.serializer import serialize_doc

products_collection = get_collection("products")


def _calculate_tags(p):
    tags = []
    
    # NEW TAG
    created_at = p.get("created_at")
    if created_at:
        try:
            # Handle string or datetime
            if isinstance(created_at, str):
                created_at = datetime.fromisoformat(created_at.replace('Z', ''))
            
            if (datetime.utcnow() - created_at).days <= 7:
                tags.append("new")
        except:
            pass
            
    # BEST SELLER TAG
    sold = p.get("sold_count", 0)
    if sold > 10:
        tags.append("best_seller")
        
    return tags


def _calculate_best_seller_score(p, avg_rating, review_trust):
    # Formula: (Velocity * 0.4) + (Revenue * 0.2) + (Trust * 0.2) + (Quality * 0.1) + (Trend * 0.1)
    
    # Mocking historical data for demonstration as we don't have order history analytics yet
    # In production, this would aggregate from the `orders` collection
    
    # 1. Sales Velocity (orders last 7 days / 7)
    # Using 'sold_count' as a proxy for total lifetime sales for now
    velocity = (p.get("sold_count", 0) / 10)  # simple proxy
    
    # 2. Revenue (price * quantity sold)
    revenue = p.get("price", 0) * p.get("sold_count", 0)
    
    # 3. Recent Trend (mocked random factor for demo, or 1.0)
    trend = 1.0 
    
    # Normalize values (simple scaling)
    # Assuming max expected velocity ~ 10, max revenue ~ 10000
    norm_velocity = min(velocity / 10, 1.0)
    norm_revenue = min(revenue / 10000, 1.0)
    
    score = (norm_velocity * 0.4) + \
            (norm_revenue * 0.2) + \
            (review_trust * 0.2) + \
            ((avg_rating / 5) * 0.1) + \
            (trend * 0.1)
            
    return score

# ------------------------------------------------------
# GET ALL PUBLIC PRODUCTS (HOME PAGE)
# ------------------------------------------------------
async def get_all_user_products():
    products = await products_collection.find(
        {},
        {
            "_id": 1,
            "title": 1,
            "price": 1,
            "description": 1,
            "stock": 1,
            "images": 1,
            "created_at": 1,
            "sold_count": 1
        }
    ).to_list(None)

    # Pre-fetch reviews to calculate scores
    reviews_coll = get_collection("reviews")
    all_reviews = await reviews_coll.find({}).to_list(None)
    
    # Group reviews by product
    reviews_map = {}
    for r in all_reviews:
        pid = r["product_id"]
        if pid not in reviews_map:
            reviews_map[pid] = []
        reviews_map[pid].append(r)

    result = []
    for p in products:
        pid = str(p["_id"])
        prod_reviews = reviews_map.get(pid, [])
        avg_rating, _ = _calculate_weighted_rating(prod_reviews)
        
        # Calculate Best Seller Score
        # Trust is 1.0 by default in our model currently
        bs_score = _calculate_best_seller_score(p, avg_rating, 1.0)
        
        tags = _calculate_tags(p)
        
        # Override "Best Seller" tag based on Score
        if bs_score > 0.5: # Arbitrary threshold for "High Score"
            if "best_seller" not in tags:
                tags.append("best_seller")
        
        p = serialize_doc(p)
        p["image"] = p.get("images", [None])[0]
        p["tags"] = tags
        p["bs_score"] = round(bs_score, 2)
        result.append(p)

    # Sort by Best Seller Score Descending
    result.sort(key=lambda x: x.get("bs_score", 0), reverse=True)

    return result


# ------------------------------------------------------
# GET SINGLE PUBLIC PRODUCT
# ------------------------------------------------------
def _calculate_weighted_rating(reviews):
    if not reviews:
        return 0, 0
    
    # Formula: Σ(rating × trust × quality) / Σ(trust × quality)
    numerator = 0.0
    denominator = 0.0
    
    for r in reviews:
        trust = r.get("trust_score", 1.0)
        quality = r.get("quality_score", 1.0)
        rating = r.get("rating", 0)
        
        weight = trust * quality
        numerator += rating * weight
        denominator += weight
        
    if denominator == 0:
        return 0, 0
        
    final_score = round(numerator / denominator, 1)
    return final_score, len(reviews)


async def get_single_user_product(product_id: str):
    # Prevent crash if ID = "undefined"
    if product_id == "undefined":
        return None

    product = await products_collection.find_one(
        {"_id": ObjectId(product_id)},
        {
            "_id": 1,
            "title": 1,
            "price": 1,
            "description": 1,
            "stock": 1,
            "images": 1,
            "created_at": 1,
            "sold_count": 1
        }
    )

    if not product:
        return None

    # Calculate Weighted Rating
    # We need to fetch reviews. To avoid circular imports, accessing collection directly.
    reviews_coll = get_collection("reviews")
    reviews = await reviews_coll.find({"product_id": product_id}).to_list(None)
    
    avg_rating, review_count = _calculate_weighted_rating(reviews)

    tags = _calculate_tags(product)
    product = serialize_doc(product)
    product["image"] = product.get("images", [None])[0]
    product["tags"] = tags
    product["rating"] = avg_rating
    product["review_count"] = review_count

    return product


async def get_recommended_user_products(product_id: str, limit: int = 4):

    if product_id == "undefined":
        return []

    # 1️⃣ Get current product
    current = await products_collection.find_one(
        {"_id": ObjectId(product_id)},
        {"category_id": 1}
    )

    if not current:
        return []

    category_id = current.get("category_id")

    # 2️⃣ Same category + exclude current
    cursor = products_collection.find(
        {
            "category_id": category_id,
            "_id": {"$ne": ObjectId(product_id)}
        },
        {
            "_id": 1,
            "title": 1,
            "price": 1,
            "images": 1,
            "created_at": 1,
            "sold_count": 1
        }
    )

    products = await cursor.to_list(length=20)

    # 3️⃣ Random order
    random.shuffle(products)

    # 4️⃣ Limit results
    result = []
    for p in products[:limit]:
        tags = _calculate_tags(p)
        p = serialize_doc(p)
        p["image"] = p.get("images", [None])[0]
        p["tags"] = tags
        result.append(p)

    return result