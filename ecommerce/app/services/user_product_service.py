import random
from datetime import datetime, timedelta
from bson import ObjectId
from app.database import get_collection
from app.utils.serializer import serialize_doc

products_collection = get_collection("products")


async def _get_recent_sales_map(days=7):
    """
    Aggregation to get total quantity sold per product in the last X days.
    """
    orders_coll = get_collection("orders")
    since = datetime.utcnow() - timedelta(days=days)
    
    pipeline = [
        {"$match": {"created_at": {"$gte": since}, "status": {"$ne": "cancelled"}}},
        {"$unwind": "$items"},
        {"$group": {
            "_id": "$items.product_id",
            "recent_sales": {"$sum": "$items.quantity"}
        }}
    ]
    
    results = await orders_coll.aggregate(pipeline).to_list(None)
    return {str(r["_id"]): r["recent_sales"] for r in results}


def _calculate_tags(p, recent_sales=0, total_products=1):
    tags = []
    
    # Standardize created_at to a datetime object
    raw_created = p.get("created_at")
    created_at = None
    if raw_created:
        try:
            if isinstance(raw_created, str):
                created_at = datetime.fromisoformat(raw_created.replace('Z', ''))
            elif isinstance(raw_created, datetime):
                created_at = raw_created
        except:
            pass
            
    # NEW TAG (last 7 days)
    if created_at and (datetime.utcnow() - created_at).days <= 7:
        tags.append("new")
            
    # TRENDING TAG
    # If recent sales are significant (arbitrary threshold or relative to avg)
    if recent_sales >= 5: # Minimum 5 sales in 7 days to be "trending"
        tags.append("trending")

    # BEST SELLER TAG
    # Refined: Need both lifetime sales and some recent activity to stay "Best Seller"
    try:
        sold = int(p.get("sold_count", 0))
    except (ValueError, TypeError):
        sold = 0
    days_since = (datetime.utcnow() - created_at).days if created_at else 999
    if sold > 20 and (recent_sales > 0 or days_since < 30):
        tags.append("best_seller")
        
    return tags


def _calculate_best_seller_score(p, avg_rating, review_trust, recent_sales=0):
    # Formula: (Recent Velocity * 0.5) + (Lifetime Sold * 0.1) + (Revenue * 0.1) + (Trust * 0.1) + (Quality * 0.1) + (Trend * 0.1)
    
    # 1. Sales Velocity (recent sales)
    velocity = recent_sales / 7.0
    
    # 2. Revenue (based on price)
    try:
        price = float(p.get("price", 0))
    except (ValueError, TypeError):
        price = 0
    revenue = price * recent_sales
    
    # 3. Lifetime sales proxy
    lifetime = p.get("sold_count", 0)
    
    # Normalize values (simple scaling)
    norm_velocity = min(velocity / 2, 1.0) # 2 sales/day is max norm
    norm_revenue = min(revenue / 5000, 1.0)
    norm_lifetime = min(lifetime / 100, 1.0)
    
    score = (norm_velocity * 0.5) + \
            (norm_lifetime * 0.1) + \
            (norm_revenue * 0.1) + \
            (review_trust * 0.1) + \
            ((avg_rating / 5) * 0.1) + \
            (0.1) # Trend base
            
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

    # Fetch recent sales map
    recent_sales_map = await _get_recent_sales_map(7)

    # Pre-fetch reviews to calculate scores
    reviews_coll = get_collection("reviews")
    all_reviews = await reviews_coll.find({}).to_list(None)
    
    # Group reviews by product
    reviews_map = {}
    for r in all_reviews:
        pid = r.get("product_id")
        if not pid:
            continue
        if pid not in reviews_map:
            reviews_map[pid] = []
        reviews_map[pid].append(r)

    result = []
    for p in products:
        pid = str(p["_id"])
        prod_reviews = reviews_map.get(pid, [])
        avg_rating, _ = _calculate_weighted_rating(prod_reviews)
        
        recent_sales = recent_sales_map.get(pid, 0)
        
        # Calculate Best Seller Score with Recent Velocity
        bs_score = _calculate_best_seller_score(p, avg_rating, 1.0, recent_sales)
        
        tags = _calculate_tags(p, recent_sales, len(products))
        
        # Override "Best Seller" tag based on Score if very high
        if bs_score > 0.6: 
            if "best_seller" not in tags:
                tags.append("best_seller")
        
        p = serialize_doc(p)
        p["image"] = (p.get("images") or [None])[0]
        p["tags"] = tags
        p["bs_score"] = round(bs_score, 2)
        p["recent_sales"] = recent_sales
        result.append(p)

    # Sort by Best Seller Score Descending (Trending/Hot items first)
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
        try:
            trust = float(r.get("trust_score", 1.0))
            quality = float(r.get("quality_score", 1.0))
            rating = float(r.get("rating", 0))
            
            weight = trust * quality
            numerator += rating * weight
            denominator += weight
        except (ValueError, TypeError):
            continue
        
    if denominator == 0:
        return 0, 0
        
    final_score = round(numerator / denominator, 1)
    return final_score, len(reviews)


async def get_single_user_product(product_id: str):
    # Prevent crash if ID = "undefined"
    if product_id == "undefined":
        return None

    try:
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
                "sold_count": 1,
                "category": 1
            }
        )
    except Exception:
        return None

    if not product:
        return None

    # Calculate Recent Sales for this specific product
    orders_coll = get_collection("orders")
    since = datetime.utcnow() - timedelta(days=7)
    recent_sales_count = await orders_coll.count_documents({
        "created_at": {"$gte": since},
        "status": {"$ne": "cancelled"},
        "items.product_id": product_id
    })

    # Note: count_documents above counts orders, not quantity. 
    # For a single product view, we'll proxy it or use aggregation if needed.
    # Let's use aggregation for accuracy in quantity.
    pipeline = [
        {"$match": {"created_at": {"$gte": since}, "status": {"$ne": "cancelled"}, "items.product_id": product_id}},
        {"$unwind": "$items"},
        {"$match": {"items.product_id": product_id}},
        {"$group": {"_id": None, "total": {"$sum": "$items.quantity"}}}
    ]
    agg_res = await orders_coll.aggregate(pipeline).to_list(1)
    recent_qty = agg_res[0]["total"] if agg_res else 0

    # Fetch reviews for the product
    reviews_coll = get_collection("reviews")
    reviews = await reviews_coll.find({"product_id": product_id}).to_list(None)

    avg_rating, review_count = _calculate_weighted_rating(reviews)

    tags = _calculate_tags(product, recent_qty)
    product = serialize_doc(product)
    product["image"] = (product.get("images") or [None])[0]
    product["tags"] = tags
    product["rating"] = avg_rating
    product["review_count"] = review_count
    product["recent_sales"] = recent_qty

    return product


async def get_recommended_user_products(product_id: str, limit: int = 4):

    if product_id == "undefined":
        return []

    # 1️⃣ Get current product
    try:
        current = await products_collection.find_one(
            {"_id": ObjectId(product_id)},
            {"category_id": 1}
        )
    except Exception:
        return []

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
    recent_sales_map = await _get_recent_sales_map(7)
    
    result = []
    for p in products[:limit]:
        pid = str(p["_id"])
        recent_qty = recent_sales_map.get(pid, 0)
        tags = _calculate_tags(p, recent_qty)
        p = serialize_doc(p)
        p["image"] = (p.get("images") or [None])[0]
        p["tags"] = tags
        result.append(p)

    return result