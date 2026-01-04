from fastapi import FastAPI
from app.routers import auth, products, users_router,cart,orders,admin_auth,shop_owner_auth,shop_owner_orders,admin_users,admin_shop_owners,admin_dashboard,shop_owner_dashboard,wishlist,admin_management,notifications,shop_owner_products,user_products,category_router,checkout,profile,shop_owner_profile,shop_owner_bank
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # allow your HTML to call API
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.mount("/static", StaticFiles(directory="app/static"), name="static")

app.include_router(auth.router)
app.include_router(users_router.router)
app.include_router(wishlist.router)
app.include_router(user_products.router)

app.include_router(checkout.router)


app.include_router(category_router.router)

app.include_router(products.router)
app.include_router(cart.router)
app.include_router(orders.router)

app.include_router(admin_auth.router)
app.include_router(admin_shop_owners.router)
app.include_router(admin_users.router)
app.include_router(admin_dashboard.router)
app.include_router(admin_management.router)

app.include_router(shop_owner_auth.router)
app.include_router(shop_owner_orders.router)
app.include_router(shop_owner_dashboard.router)
app.include_router(shop_owner_products.router)


app.include_router(notifications.router)

app.include_router(profile.router)
app.include_router(shop_owner_profile.router)
app.include_router(shop_owner_bank.router)