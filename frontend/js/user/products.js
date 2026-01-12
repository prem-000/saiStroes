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

                    <button
                    class="btn add-cart-btn"
                    onclick="addToCart('${p.id}', 1, this)">
                    Add to Cart
                    </button>

                    <button class="btn buy-btn" onclick="buyNow('${p.id}')">Buy Now</button>

                    <div class="recommended-section">
                    <h3 class="section-title">You may also like</h3>
                    <div id="recommendedList" class="recommended-list"></div>
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
        loadReviews(productId);
    } catch {
        container.innerHTML = `<p>Product not found.</p>`;
    }
}


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
   BANNERS (HOMEPAGE ONLY)
-------------------------------------------------- */
let bannerInterval;

async function loadBanners() {
    const slider = document.getElementById("bannerSlider");
    const wrapper = slider ? slider.parentElement : null;
    if (!slider || !wrapper) return; // not homepage

    try {
        const banners = await apiRequest("/api/banners");

        if (!banners || banners.length === 0) {
            wrapper.style.display = "none";
            return;
        }

        // 1. Render Slides
        slider.innerHTML = banners.map(b => `
            <div class="banner-slide">
                <img src="${b.image}" alt="${b.title}" loading="lazy">
            </div>
        `).join("");

        // 2. Render Dots
        const existingDots = wrapper.querySelector(".banner-dots");
        if (existingDots) existingDots.remove();

        const dotsContainer = document.createElement("div");
        dotsContainer.className = "banner-dots";

        banners.forEach((_, i) => {
            const dot = document.createElement("div");
            dot.className = `dot ${i === 0 ? "active" : ""}`;
            dot.onclick = () => {
                scrollToBanner(i);
                resetBannerTimer(); // Reset timer on manual interaction
            };
            dotsContainer.appendChild(dot);
        });

        wrapper.appendChild(dotsContainer);

        // 3. Listen for scroll to update dots (e.g. user swipe)
        slider.addEventListener("scroll", () => {
            const index = Math.round(slider.scrollLeft / slider.offsetWidth);
            updateBannerDots(index);
        }, { passive: true });

        // 4. Start Timer
        startBannerAutoScroll();

    } catch (err) {
        console.error("Failed loading banners:", err);
    }
}

function updateBannerDots(index) {
    const dots = document.querySelectorAll(".banner-dots .dot");
    dots.forEach((d, i) => {
        if (i === index) d.classList.add("active");
        else d.classList.remove("active");
    });
}

function scrollToBanner(index) {
    const slider = document.getElementById("bannerSlider");
    if (!slider) return;
    slider.scrollTo({
        left: slider.offsetWidth * index,
        behavior: "smooth"
    });
}

function startBannerAutoScroll() {
    if (bannerInterval) clearInterval(bannerInterval);
    bannerInterval = setInterval(() => {
        const slider = document.getElementById("bannerSlider");
        if (!slider || slider.children.length === 0) return;

        let index = Math.round(slider.scrollLeft / slider.offsetWidth);
        index = (index + 1) % slider.children.length;
        scrollToBanner(index);
    }, 4000);
}

function resetBannerTimer() {
    startBannerAutoScroll();
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
