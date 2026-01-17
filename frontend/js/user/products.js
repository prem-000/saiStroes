import { apiRequest } from "../api.js";

/* --------------------------------------------------
   DOM ELEMENTS
-------------------------------------------------- */
const productList = document.getElementById("productList");
const categoryGrid = document.getElementById("categoryGrid");
const container = document.getElementById("productContainer");
const searchInput = document.getElementById("searchInput");

// Store all products for search
let allProducts = [];

/* --------------------------------------------------
    LOAD ALL PRODUCTS FOR SEARCH
-------------------------------------------------- */
async function loadAllProducts() {
    try {
        allProducts = await apiRequest("/user/products/");
    } catch (err) {
        console.error("Failed loading all products:", err);
        allProducts = [];
    }
}

/* --------------------------------------------------
    CART BADGE UPDATE
-------------------------------------------------- */
async function updateCartCount() {
    const badge = document.getElementById("cartCount");
    if (!badge) return;

    try {
        const data = await apiRequest("/cart/");
        const count = Array.isArray(data.items) ? data.items.length : 0;
        badge.textContent = count;
        badge.style.display = count > 0 ? "inline-block" : "none";
    } catch {
        badge.textContent = 0;
        badge.style.display = "none";
    }
}

/* --------------------------------------------------
    NOTIFICATION BADGE UPDATE
-------------------------------------------------- */
async function updateNotificationCount() {
    const badge = document.getElementById("notifCount");
    if (!badge) return;

    try {
        const notifications = await apiRequest("/notifications/me");
        const unread = notifications.filter(n => !n.read).length;
        badge.textContent = unread;
        badge.style.display = unread > 0 ? "inline-block" : "none";
    } catch {
        badge.style.display = "none";
    }
}

/* --------------------------------------------------
    CATEGORY SECTIONS (SAFE VERSION)
-------------------------------------------------- */
async function loadCategorySections() {
    if (!productList) return; // ← IMPORTANT FIX

    try {
        const categories = await apiRequest("/categories/");
        productList.innerHTML = "";

        for (const category of categories) {
            const products = await apiRequest(`/categories/${category}`);
            if (!products.length) continue;

            productList.innerHTML += `
                <div class="category-block">
                    <h3 class="section-title"> ${category.toUpperCase()}</h3>

                    <div class="scroll-wrapper">
                        <button class="scroll-btn left-btn" onclick="scrollLeftCat('${category}')">&#8249;</button>

                        <section class="horizontal-scroll" id="list-${category}">
                            ${products.map(p => `
                                    <div class="product-card">
                                        ${p.tags && p.tags.includes("new") ? '<span class="product-tag tag-new">New</span>' : ''}
                                        ${p.tags && p.tags.includes("best_seller") ? '<span class="product-tag tag-best-selling">Best Seller</span>' : ''}
                                        ${p.tags && p.tags.includes("trending") ? '<span class="product-tag tag-trending">Trending</span>' : ''}
                                        <img src="${p.image || './default.jpg'}" loading="lazy" class="product-img">
                                        <h3>${p.title}</h3>
                                        <p class="price">₹${p.price}</p>
                                        <button onclick="viewProduct('${p.id}')">View</button>
                                    </div>
                            `).join("")}
                        </section>

                        <button class="scroll-btn right-btn" onclick="scrollRightCat('${category}')">&#8250;</button>
                    </div>
                </div>
            `;
        }
    } catch (err) {
        console.error("Failed to load category sections:", err);
        productList.innerHTML = `<p>Error loading categories</p>`;
    }
}

window.scrollLeftCat = (cat) => {
    const el = document.getElementById(`list-${cat}`);
    if (el) el.scrollBy({ left: -260, behavior: "smooth" });
};

window.scrollRightCat = (cat) => {
    const el = document.getElementById(`list-${cat}`);
    if (el) el.scrollBy({ left: 260, behavior: "smooth" });
};

/* --------------------------------------------------
    CATEGORY ICON MAPPING
-------------------------------------------------- */
const CATEGORY_ICONS = {
    // Grocery & Food
    "grocery": "fa-solid fa-basket-shopping",
    "groceries": "fa-solid fa-basket-shopping",

    // Electronics
    "electronics": "fa-solid fa-laptop",
    "electronic": "fa-solid fa-laptop",

    // Fruits & Vegetables
    "fruits": "fa-solid fa-apple-whole",
    "vegetables": "fa-solid fa-carrot",
    "veggies": "fa-solid fa-carrot",
    "organic": "fa-solid fa-leaf",

    // Dairy & Eggs
    "dairy": "fa-solid fa-cheese",
    "milk": "fa-solid fa-bottle-droplet",
    "eggs": "fa-solid fa-egg",

    // Bakery & Bread
    "bakery": "fa-solid fa-bread-slice",
    "bread": "fa-solid fa-bread-slice",

    // Beverages
    "beverages": "fa-solid fa-mug-hot",
    "drinks": "fa-solid fa-glass-water",
    "coffee": "fa-solid fa-mug-hot",
    "tea": "fa-solid fa-mug-saucer",
    "juice": "fa-solid fa-wine-bottle",

    // Snacks & Sweets
    "snacks": "fa-solid fa-cookie",
    "sweets": "fa-solid fa-candy-cane",
    "candy": "fa-solid fa-candy-cane",
    "chips": "fa-solid fa-cookie-bite",
    "chocolate": "fa-solid fa-candy-cane",

    // Meat & Seafood
    "meat": "fa-solid fa-drumstick-bite",
    "chicken": "fa-solid fa-drumstick-bite",
    "fish": "fa-solid fa-fish",
    "seafood": "fa-solid fa-fish-fins",

    // Grains & Staples
    "grains": "fa-solid fa-wheat-awn",
    "rice": "fa-solid fa-bowl-rice",
    "pasta": "fa-solid fa-bowl-food",
    "cereals": "fa-solid fa-wheat-awn",

    // Frozen Foods
    "frozen": "fa-solid fa-snowflake",
    "ice cream": "fa-solid fa-ice-cream",

    // Household & Personal Care
    "household": "fa-solid fa-house",
    "cleaning": "fa-solid fa-spray-can-sparkles",
    "personal care": "fa-solid fa-pump-soap",
    "beauty": "fa-solid fa-spa",

    // Baby & Kids
    "baby": "fa-solid fa-baby",
    "kids": "fa-solid fa-child",

    // Health & Wellness
    "health": "fa-solid fa-heart-pulse",
    "vitamins": "fa-solid fa-pills",
    "supplements": "fa-solid fa-capsules",

    // Spices & Condiments
    "spices": "fa-solid fa-pepper-hot",
    "condiments": "fa-solid fa-jar",
    "sauces": "fa-solid fa-bottle-droplet",

    // Canned & Packaged
    "canned": "fa-solid fa-can-food",
    "packaged": "fa-solid fa-box",

    // Pet Supplies
    "pet": "fa-solid fa-paw",
    "pet food": "fa-solid fa-bone",

    // Default
    "default": "fa-solid fa-cart-shopping"
};

// Color palette for categories
const CATEGORY_COLORS = {
    "grocery": "#22c55e",
    "groceries": "#22c55e",
    "electronics": "#3b82f6",
    "electronic": "#3b82f6",
    "fruits": "#ef4444",
    "vegetables": "#10b981",
    "veggies": "#10b981",
    "organic": "#84cc16",
    "dairy": "#fbbf24",
    "milk": "#fbbf24",
    "eggs": "#f59e0b",
    "bakery": "#d97706",
    "bread": "#d97706",
    "beverages": "#8b5cf6",
    "drinks": "#6366f1",
    "coffee": "#78350f",
    "tea": "#059669",
    "juice": "#ec4899",
    "snacks": "#f97316",
    "sweets": "#ec4899",
    "candy": "#f472b6",
    "chips": "#fb923c",
    "chocolate": "#7c2d12",
    "meat": "#dc2626",
    "chicken": "#ea580c",
    "fish": "#0ea5e9",
    "seafood": "#06b6d4",
    "grains": "#ca8a04",
    "rice": "#eab308",
    "pasta": "#fbbf24",
    "cereals": "#f59e0b",
    "frozen": "#0284c7",
    "ice cream": "#38bdf8",
    "household": "#6366f1",
    "cleaning": "#8b5cf6",
    "personal care": "#a855f7",
    "beauty": "#d946ef",
    "baby": "#f472b6",
    "kids": "#fb7185",
    "health": "#14b8a6",
    "vitamins": "#2dd4bf",
    "supplements": "#5eead4",
    "spices": "#dc2626",
    "condiments": "#f97316",
    "sauces": "#fb923c",
    "canned": "#64748b",
    "packaged": "#475569",
    "pet": "#a855f7",
    "pet food": "#c026d3",
    "default": "#6b7280"
};

// Helper function to get icon for category
function getCategoryIcon(categoryName) {
    const normalized = categoryName.toLowerCase().trim();
    return CATEGORY_ICONS[normalized] || CATEGORY_ICONS["default"];
}

// Helper function to get color for category
function getCategoryColor(categoryName) {
    const normalized = categoryName.toLowerCase().trim();
    return CATEGORY_COLORS[normalized] || CATEGORY_COLORS["default"];
}

/* --------------------------------------------------
    CATEGORY GRID
-------------------------------------------------- */
async function loadCategories() {
    if (!categoryGrid) return;

    try {
        const categories = await apiRequest("/categories/");

        categoryGrid.innerHTML = categories
            .map(cat => `
                <div class="cat-card" data-category="${cat}">
                    <i class="${getCategoryIcon(cat)}" style="color: ${getCategoryColor(cat)}"></i>
                    <span>${cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                </div>
            `).join("");

        initCategoryFilter();
    } catch {
        categoryGrid.innerHTML = `<p>Unable to load categories</p>`;
    }
}

/* --------------------------------------------------
    CATEGORY FILTER
-------------------------------------------------- */
function initCategoryFilter() {
    if (!productList) return;

    const cards = document.querySelectorAll(".cat-card");

    cards.forEach(card => {
        card.addEventListener("click", async () => {
            const category = card.dataset.category;

            try {
                const products = await apiRequest(`/categories/${category}`);

                productList.innerHTML = `
                    <div class="category-block">
                        <h3 class="section-title">Fresh Picks: ${category.toUpperCase()}</h3>

                        <div class="scroll-wrapper">
                            <button class="scroll-btn left-btn" onclick="scrollLeftCat('${category}')">&#8249;</button>

                            <section class="horizontal-scroll" id="list-${category}">
                                ${products.map(p => `
                                    <div class="product-card">
                                        ${p.tags && p.tags.includes("new") ? '<span class="product-tag tag-new">New</span>' : ''}
                                        ${p.tags && p.tags.includes("best_seller") ? '<span class="product-tag tag-best-selling">Best Seller</span>' : ''}
                                        ${p.tags && p.tags.includes("trending") ? '<span class="product-tag tag-trending">Trending</span>' : ''}
                                        <img src="${p.image || './default.jpg'}" loading="lazy" class="product-img">
                                        <h3>${p.title}</h3>
                                        <p class="price">₹${p.price}</p>
                                        <button onclick="viewProduct('${p.id}')">View</button>
                                    </div>
                                `).join("")}
                            </section>

                            <button class="scroll-btn right-btn" onclick="scrollRightCat('${category}')">&#8250;</button>
                        </div>
                    </div>
                `;
            } catch (err) {
                console.error(err);
            }
        });
    });
}

/* --------------------------------------------------
    SINGLE PRODUCT PAGE
-------------------------------------------------- */
const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

async function loadSingleProduct() {
    if (!container) return; // only run on product.html
    if (!productId) {
        container.innerHTML = `<p>Invalid product link.</p>`;
        return;
    }

    try {
        const p = await apiRequest(`/user/products/${productId}`);

        container.innerHTML = `
            <div class="product-page">
                <div class="image-box">
                    <img src="${p.image || '../img/default.jpg'}" class="product-img">

                </div>

                <div class="product-info">
                    <h2>${p.title}</h2>
                    <p class="product-category">Category: <b>${p.category}</b></p>
                    <h3 class="product-price">₹${p.price}</h3>
                    <p>${p.description}</p>
                    <p>Stock: <b>${p.stock}</b></p>

                    <div class="product-actions">
                        <button
                            class="btn add-cart-btn"
                            onclick="addToCart('${p.id}', 1, this)">
                            Add to Cart
                        </button>

                        <button id="wishBtn" class="btn wish-btn" onclick="toggleWishlist('${p.id}', this)">
                            <i class="fa-regular fa-heart"></i> Add to Wishlist
                        </button>
                    </div>

                    <button class="btn buy-btn" onclick="buyNow('${p.id}')">Buy Now</button>

                    <div class="recommended-section">
                        <h3 class="section-title">You may also like</h3>
                        <div id="recommendedList" class="recommended-list"></div>
                    </div>

                    <div id="trendingProductsSection" class="recommended-section" style="display: none;">
                        <h3 class="section-title">Trending Now <span>🔥</span></h3>
                        <div id="trendingProductsList" class="recommended-list"></div>
                    </div>

                    <!-- REVIEWS SECTION -->
                    <div class="reviews-section">
                        <h3 class="section-title">Customer Reviews</h3>
                        <div id="reviewList" class="review-list"></div>
                        
                        <div class="review-form">
                            <h4>Write a Review</h4>
                            <select id="reviewRating">
                                <option value="5">★★★★★ (5/5)</option>
                                <option value="4">★★★★☆ (4/5)</option>
                                <option value="3">★★★☆☆ (3/5)</option>
                                <option value="2">★★☆☆☆ (2/5)</option>
                                <option value="1">★☆☆☆☆ (1/5)</option>
                            </select>
                            <textarea id="reviewComment" placeholder="Share your thoughts..."></textarea>
                            <button onclick="submitReview('${p.id}')">Submit Review</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        loadRecommendations(productId);
        loadTrendingProducts();
        loadReviews(productId);
        checkWishlistStatus(productId);
    } catch {
        container.innerHTML = `<p>Product not found.</p>`;
    }
}

async function checkWishlistStatus(productId) {
    const btn = document.getElementById("wishBtn");
    if (!btn) return;

    try {
        const wishlist = await apiRequest("/wishlist/");
        const inWishlist = wishlist.some(item => item.product_id === productId);

        if (inWishlist) {
            btn.classList.add("active");
            btn.innerHTML = `<i class="fa-solid fa-heart"></i> In Wishlist`;
        }
    } catch (err) {
        console.error("Wishlist check failed:", err);
    }
}

window.toggleWishlist = async function (productId, btn) {
    const token = localStorage.getItem("user_token");
    if (!token) {
        alert("Please login to manage wishlist");
        return;
    }

    try {
        btn.disabled = true;
        const res = await apiRequest(`/wishlist/toggle/${productId}`, "POST");

        if (res.status === "added") {
            btn.classList.add("active");
            btn.innerHTML = `<i class="fa-solid fa-heart"></i> In Wishlist`;
        } else {
            btn.classList.remove("active");
            btn.innerHTML = `<i class="fa-regular fa-heart"></i> Add to Wishlist`;
        }
    } catch (err) {
        alert("Failed to update wishlist");
    } finally {
        btn.disabled = false;
    }
};


/* --------------------------------------------------
    RECOMMENDATIONS
-------------------------------------------------- */
async function loadRecommendations(productId) {
    try {
        const products = await apiRequest(`/user/products/${productId}/recommendations`);
        const list = document.getElementById("recommendedList");
        const section = document.querySelector(".recommended-section");

        if (!list || !section) return;

        list.innerHTML = "";

        if (!products || products.length < 2) {
            section.style.display = "none";
            return;
        }

        section.style.display = "block";

        products.forEach(p => {
            list.innerHTML += `
                <div class="product-card">
                    <img src="${p.image || '../img/default.jpg'}" class="product-img">
                    <h3>${p.title}</h3>
                    <p class="price">₹${p.price}</p>
                    <button onclick="viewProduct('${p.id}')">View</button>
                </div>
            `;
        });

    } catch (err) {
        console.error("Recommendation error:", err);
    }
}

/* --------------------------------------------------
    TRENDING PRODUCTS (FOR PRODUCT PAGE)
-------------------------------------------------- */
async function loadTrendingProducts() {
    try {
        const products = await apiRequest("/user/products/");
        const list = document.getElementById("trendingProductsList");
        const section = document.getElementById("trendingProductsSection");

        if (!list || !section) return;

        // Filter out the current product and take top 5 by bs_score
        const trending = products
            .filter(p => p.id !== productId)
            .slice(0, 5);

        if (!trending.length) {
            section.style.display = "none";
            return;
        }

        section.style.display = "block";
        list.innerHTML = trending.map(p => `
            <div class="product-card">
                ${p.tags && p.tags.includes("trending") ? '<span class="product-tag tag-trending">Trending</span>' : ''}
                <img src="${p.image || '../img/default.jpg'}" class="product-img">
                <h3>${p.title}</h3>
                <p class="price">₹${p.price}</p>
                <button onclick="viewProduct('${p.id}')">View</button>
            </div>
        `).join("");

    } catch (err) {
        console.error("Trending products error:", err);
    }
}

/* --------------------------------------------------
    SEARCH
-------------------------------------------------- */
function initSearch() {
    if (!searchInput || !productList) return;

    searchInput.addEventListener("keyup", e => {
        const keyword = e.target.value.trim().toLowerCase();

        if (!keyword) {
            loadCategorySections();
            return;
        }

        const results = allProducts.filter(
            p => p.title.toLowerCase().includes(keyword)
        );

        productList.innerHTML = `
            <h3 class="section-title">Search Results</h3>

            <div class="scroll-wrapper">
                <section class="horizontal-scroll">
                    ${results.map(p => `
                        <div class="product-card">
                            ${p.tags && p.tags.includes("new") ? '<span class="product-tag tag-new">New</span>' : ''}
                            ${p.tags && p.tags.includes("best_seller") ? '<span class="product-tag tag-best-selling">Best Seller</span>' : ''}
                            ${p.tags && p.tags.includes("trending") ? '<span class="product-tag tag-trending">Trending</span>' : ''}
                            <img src="${p.image || './default.jpg'}" class="product-img">
                            <h3>${p.title}</h3>
                            <p class="price">₹${p.price}</p>
                            <button onclick="viewProduct('${p.id}')">View</button>
                        </div>
                    `).join("")}
                </section>
            </div>
        `;
    });
}

/* --------------------------------------------------
    VIEW PRODUCT
-------------------------------------------------- */
window.viewProduct = (id) => {
    window.location.href = `product.html?id=${id}`;
};

/* --------------------------------------------------
    ADD TO CART
-------------------------------------------------- */
async function addToCartBackend(productId, quantity = 1, btn) {
    if (!btn) return;

    const originalText = btn.innerText;

    const token =
        localStorage.getItem("user_token") ||
        localStorage.getItem("shop_owner_token");

    if (!token) {
        btn.classList.add("login-required");
        btn.innerText = "Login first";

        setTimeout(() => {
            btn.classList.remove("login-required");
            btn.innerText = originalText;
        }, 1500);

        return;
    }

    try {
        btn.classList.add("loading");
        btn.innerText = "Adding...";

        await apiRequest(
            `/cart/add?product_id=${productId}&quantity=${quantity}`,
            "POST"
        );

        await updateCartCount();

        btn.classList.remove("loading");
        btn.innerText = "Added ✓";

        /* reset after 3 seconds */
        setTimeout(() => {
            btn.innerText = "Add to Cart";
            btn.disabled = false;
        }, 3000);


    } catch {
        btn.classList.remove("loading");
        btn.innerText = originalText;
    }
}

window.addToCart = addToCartBackend;

/* --------------------------------------------------
    BUY NOW
-------------------------------------------------- */
window.buyNow = async (id) => {
    const tempBtn = document.createElement("button");
    await addToCartBackend(id, 1, tempBtn);
    window.location.href = "cart.html";
};

/* --------------------------------------------------
   DYNAMIC BANNERS (HOMEPAGE ONLY)
-------------------------------------------------- */
const COLOR_PALETTES = [
    ["#1a1a2e", "#16213e", "#0f3460"], // Deep Navy
    ["#2d1b69", "#5b2c6f", "#8e44ad"], // Royal Purple
    ["#0a192f", "#172a45", "#1e3a5f"], // Midnight Blue
    ["#1f1c2c", "#928dab", "#5f4b8b"], // Twilight Purple
    ["#141e30", "#243b55", "#2c5364"], // Ocean Deep
    ["#2c003e", "#512b58", "#7b2869"], // Deep Magenta
    ["#000428", "#004e92", "#1a5490"], // Deep Ocean
    ["#360033", "#0b8793", "#1a5f7a"]  // Teal Night
];

const TEXT_VARIATIONS = [
    "✨ Discover Premium Picks",
    "🔥 Trending Now - Shop Fresh",
    "🎯 Your Daily Essentials Await",
    "💫 Handpicked Just For You",
    "🌟 Quality Meets Convenience",
    "🛒 Fresh Deals, Fast Delivery",
    "⚡ Shop Smart, Save More"
];

let currentBannerTimer = null;
let isBannerHovered = false;

async function loadBanners() {
    const banner = document.getElementById("dynamicBanner");
    if (!banner) return; // not homepage

    // Initial load
    updateDynamicBanner();

    // Start rotation
    startBannerRotation();

    // Hover logic
    banner.addEventListener("mouseenter", () => {
        isBannerHovered = true;
        if (currentBannerTimer) clearTimeout(currentBannerTimer);
    });

    banner.addEventListener("mouseleave", () => {
        isBannerHovered = false;
        startBannerRotation();
    });
}

function startBannerRotation() {
    if (currentBannerTimer) clearTimeout(currentBannerTimer);
    currentBannerTimer = setTimeout(async () => {
        if (!isBannerHovered) {
            await updateDynamicBanner();
            startBannerRotation();
        }
    }, 5000);
}

async function updateDynamicBanner() {
    const banner = document.getElementById("dynamicBanner");
    const content = document.getElementById("bannerContent");
    const textEl = document.getElementById("bannerText");
    const productsEl = document.getElementById("bannerProducts");

    if (!banner || !content || !allProducts || allProducts.length === 0) return;

    // 1. Fade out
    content.classList.add("fade-out");

    await new Promise(r => setTimeout(r, 500));

    // 2. Select Random Items
    const palette = COLOR_PALETTES[Math.floor(Math.random() * COLOR_PALETTES.length)];
    const angle = Math.floor(Math.random() * 360);
    const slogan = TEXT_VARIATIONS[Math.floor(Math.random() * TEXT_VARIATIONS.length)];

    // Pick 3-5 random products
    const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
    const selectedProds = shuffled.slice(0, 3 + Math.floor(Math.random() * 2));

    // 3. Update Styles & Content
    banner.style.background = `linear-gradient(${angle}deg, ${palette[0]} 0%, ${palette[1]} 50%, ${palette[2]} 100%)`;

    textEl.innerText = slogan;
    textEl.style.color = "#fff";
    textEl.style.fontSize = `${32 + Math.random() * 20}px`;
    textEl.style.transform = `rotate(${Math.random() * 6 - 3}deg)`;

    productsEl.innerHTML = selectedProds.map((p, i) => `
        <img src="${p.image || './default.jpg'}" 
             class="banner-prod-img" 
             onclick="viewProduct('${p.id}')"
             title="${p.title}"
             style="transition-delay: ${i * 0.1}s">
    `).join("");

    // 4. Fade in
    content.classList.remove("fade-out");
}

/* --------------------------------------------------
    INITIAL LOAD
-------------------------------------------------- */
/* --------------------------------------------------
    REVIEWS
-------------------------------------------------- */
async function loadReviews(productId) {
    const list = document.getElementById("reviewList");
    if (!list) return;

    try {
        const reviews = await apiRequest(`/reviews/${productId}`);

        if (reviews.length === 0) {
            list.innerHTML = `<p class="muted">No reviews yet. Be the first!</p>`;
            return;
        }

        list.innerHTML = reviews.map(r => `
            <div class="review-card">
                <div class="review-header">
                    <strong>${r.username}</strong>
                    <span class="stars">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</span>
                </div>
                <p>${r.comment}</p>
                <small class="muted">${new Date(r.created_at).toLocaleDateString()}</small>
            </div>
        `).join("");

    } catch (err) {
        console.error("Failed to load reviews:", err);
    }
}

window.submitReview = async (productId) => {
    const rating = document.getElementById("reviewRating").value;
    const comment = document.getElementById("reviewComment").value;

    if (!comment) {
        alert("Please write a comment");
        return;
    }

    try {
        await apiRequest("/reviews/", "POST", {
            product_id: productId,
            rating: parseInt(rating),
            comment: comment
        });

        alert("Review submitted!");
        document.getElementById("reviewComment").value = "";
        loadReviews(productId);
    } catch (err) {
        alert(err.message || "Failed to submit review");
    }
};

document.addEventListener("DOMContentLoaded", async () => {
    await loadAllProducts();
    initSearch();
    loadBanners();

    if (productList) loadCategorySections();
    if (categoryGrid) loadCategories();
    loadSingleProduct();

    updateCartCount();
    updateNotificationCount();
});

setInterval(updateNotificationCount, 30000);

/* --------------------------------------------------
   HERO BANNER AUTO-ROTATION
-------------------------------------------------- */
const HERO_BANNERS = [
    {
        hook: "Level Up Your Audio",
        subtext: "Premium wireless earbuds with 40hr battery",
        cta: "Shop Now",
        category: "electronics"
    },
    {
        hook: "Summer Sale 50% Off",
        subtext: "Huge discounts on fresh groceries",
        cta: "Shop Deals",
        category: "grocery"
    },
    {
        hook: "Fresh Daily Essentials",
        subtext: "Hand-picked fruits & vegetables every morning",
        cta: "Shop Fresh",
        category: "fruits"
    },
    {
        hook: "Premium Snacks Await",
        subtext: "Crunchy, tasty, and always fresh",
        cta: "Explore Snacks",
        category: "snacks"
    }
];

let currentHeroIndex = 0;
let heroRotationTimer = null;
let heroProductId = null;

async function loadHeroBanner() {
    const heroBanner = document.getElementById("heroBanner");
    if (!heroBanner || !allProducts || allProducts.length === 0) return;

    await updateHeroBanner();
    startHeroRotation();

    // Pause on hover
    heroBanner.addEventListener("mouseenter", () => {
        if (heroRotationTimer) clearTimeout(heroRotationTimer);
    });

    heroBanner.addEventListener("mouseleave", () => {
        startHeroRotation();
    });
}

function startHeroRotation() {
    if (heroRotationTimer) clearTimeout(heroRotationTimer);
    heroRotationTimer = setTimeout(async () => {
        currentHeroIndex = (currentHeroIndex + 1) % HERO_BANNERS.length;
        await updateHeroBanner();
        startHeroRotation();
    }, 8000);
}

async function updateHeroBanner() {
    const hookEl = document.getElementById("heroHook");
    const subtextEl = document.getElementById("heroSubtext");
    const ctaEl = document.getElementById("heroCTA");
    const imageEl = document.getElementById("heroImage");

    if (!hookEl || !allProducts || allProducts.length === 0) return;

    const banner = HERO_BANNERS[currentHeroIndex];

    // Find a product from the category
    const categoryProducts = allProducts.filter(p =>
        p.category && p.category.toLowerCase() === banner.category.toLowerCase()
    );

    const product = categoryProducts.length > 0
        ? categoryProducts[Math.floor(Math.random() * categoryProducts.length)]
        : allProducts[Math.floor(Math.random() * allProducts.length)];

    heroProductId = product.id;

    // Update content with fade effect
    hookEl.style.opacity = "0";
    subtextEl.style.opacity = "0";
    ctaEl.style.opacity = "0";
    imageEl.style.opacity = "0";

    setTimeout(() => {
        hookEl.textContent = banner.hook;
        subtextEl.textContent = banner.subtext;
        ctaEl.textContent = banner.cta;
        imageEl.src = product.image || "../img/default.jpg";
        imageEl.alt = product.title;

        hookEl.style.opacity = "1";
        subtextEl.style.opacity = "1";
        ctaEl.style.opacity = "1";
        imageEl.style.opacity = "1";
    }, 300);
}

window.heroAction = function () {
    if (heroProductId) {
        window.location.href = `product.html?id=${heroProductId}`;
    }
};

document.addEventListener("DOMContentLoaded", async () => {
    await loadAllProducts();
    initSearch();
    loadBanners();
    loadHeroBanner(); // Initialize hero banner

    if (productList) loadCategorySections();
    if (categoryGrid) loadCategories();
    loadSingleProduct();

    updateCartCount();
    updateNotificationCount();
});

setInterval(updateNotificationCount, 30000);

