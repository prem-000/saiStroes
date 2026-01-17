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
    CATEGORY GRID
-------------------------------------------------- */
async function loadCategories() {
    if (!categoryGrid) return;

    try {
        const categories = await apiRequest("/categories/");

        categoryGrid.innerHTML = categories
            .map(cat => `
                <div class="cat-card" data-category="${cat}">
                    ${cat.charAt(0).toUpperCase() + cat.slice(1)}
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
    ["#FF6B35", "#F7931E", "#FDC830"], // Orange
    ["#667EEA", "#764BA2", "#F093FB"], // Purple
    ["#4FACFE", "#00F2FE", "#43E97B"], // Blue
    ["#FF0844", "#FFB199", "#FF0844"], // Red
    ["#09203F", "#537895", "#09203F"]  // Dark
];

const TEXT_VARIATIONS = [
    "Crunchy Snacks for Every Mood",
    "Pick Your Perfect Snack",
    "Fresh Groceries, Faster Delivery",
    "Delicious Deals Just for You",
    "Smart Savings on Daily Essentials"
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
