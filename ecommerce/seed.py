import asyncio
from app.database import get_collection
from datetime import date

async def seed():
    # 1. Seed Banner from actual products
    banners = get_collection("banners")
    products = get_collection("products")
    await banners.delete_many({})
    
    # Fetch some products with images
    pipeline = [{"$match": {"images": {"$exists": True, "$ne": []}}}, {"$sample": {"size": 4}}]
    prods = await products.aggregate(pipeline).to_list(length=4)
    
    if not prods:
        print("No products with images found. Seeding default banners.")
        # Fallback to default if no products
        await banners.insert_one({
            "title": "Fresh Vegetables",
            "image_url": "https://images.unsplash.com/photo-1540340061722-9293d5163008?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200",
            "redirect_url": "/frontend/user/products.html",
            "priority": 10,
            "is_active": True,
            "start_date": "2023-01-01",
            "end_date": "2030-12-31"
        })
    else:
        print(f"Seeding {len(prods)} banners from products...")
        for p in prods:
            img = p["images"][0]
            await banners.insert_one({
                "title": p.get("title", "Special Offer"),
                "image_url": img,
                "redirect_url": f"/frontend/user/products.html?id={p['_id']}",
                "priority": 5,
                "is_active": True,
                "start_date": "2023-01-01",
                "end_date": "2030-12-31"
            })
    
    print("Banners seeded.")

if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    loop.run_until_complete(seed())
