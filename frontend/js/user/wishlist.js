import { apiRequest } from "../api.js";

const grid = document.getElementById("wishlistGrid");

async function loadWishlist() {
    try {
        const items = await apiRequest("/wishlist/");

        if (!items || items.length === 0) {
            grid.innerHTML = `
                <div style="text-align:center; padding: 50px 20px;">
                    <i class="fa-regular fa-heart" style="font-size: 50px; color: #ddd; margin-bottom: 20px; display:block;"></i>
                    <p style="color:#888;">Your wishlist is empty.</p>
                    <a href="products.html" style="color:#4a6cf7; text-decoration:none; font-weight:600; margin-top:20px; display:inline-block;">Go Shopping</a>
                </div>
            `;
            return;
        }

        grid.innerHTML = items
            .map(
                (item) => `
            <div class="wish-card">
                <img src="${item.image || '../img/default.jpg'}" class="wish-img">

                <div class="wish-info">
                    <p class="wish-title">${item.title}</p>
                    <p class="wish-price">₹${item.price}</p>

                    <div class="wishlist-actions">
                        <button class="btn-cart" onclick="moveToCart('${item.product_id}')">
                            <i class="fa-solid fa-cart-plus"></i> Move to Cart
                        </button>

                        <button class="btn-remove" onclick="removeFromWishlist('${item.product_id}')">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            </div>
        `
            )
            .join("");

    } catch (err) {
        console.error(err);
        grid.innerHTML = "<p>Failed to load wishlist. Please try logging in again.</p>";
    }
}

loadWishlist();

/* --------------------------------------------------
   REMOVE FROM WISHLIST
-------------------------------------------------- */
window.removeFromWishlist = async function (productId) {
    if (!confirm("Remove this item?")) return;

    try {
        await apiRequest(`/wishlist/remove/${productId}`, "DELETE");
        loadWishlist();
    } catch (err) {
        console.error(err);
        alert("Failed to remove item");
    }
};

/* --------------------------------------------------
   MOVE TO CART
-------------------------------------------------- */
window.moveToCart = async function (productId) {
    try {
        await apiRequest(`/cart/add?product_id=${productId}&quantity=1`, "POST");
        await apiRequest(`/wishlist/remove/${productId}`, "DELETE");

        alert("Added to cart!");
        loadWishlist();
    } catch (err) {
        console.error(err);
        alert("Failed to move to cart");
    }
};
