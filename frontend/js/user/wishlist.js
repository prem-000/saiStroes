import { apiRequest } from "../api.js";

const container = document.getElementById("wishlistContainer");

async function loadWishlist() {
    try {
        const items = await apiRequest("/wishlist/");

        if (!items.length) {
            container.innerHTML = "<p>No items in wishlist.</p>";
            return;
        }

        // Fetch complete product info for each wishlist item
        const detailedItems = await Promise.all(
            items.map(async (item) => {
                try {
                    const product = await apiRequest(`/user/products/${item.product_id}`);

                    return {
                        product_id: item.product_id,
                        title: product.title,
                        price: product.price,
                        image: product.image,
                    };
                } catch (err) {
                    console.error("Product fetch failed:", item.product_id);
                    return {
                        product_id: item.product_id,
                        title: "Unknown Product",
                        price: 0,
                        image: "../img/default.jpg",
                    };
                }
            })
        );

        container.innerHTML = detailedItems
            .map(
                (item) => `
            <div class="wish-card">
                <img src="${item.image || '../img/default.jpg'}" class="wish-img">

                <div class="wish-info">
                    <p class="wish-title">${item.title}</p>
                    <p class="wish-price">₹${item.price}</p>

                    <div class="wishlist-actions">

                        <button class="btn-cart" onclick="moveToCart('${item.product_id}')">
                            Move to Cart
                        </button>

                        <button class="btn-remove" onclick="removeFromWishlist('${item.product_id}')">
                            Remove
                        </button>

                    </div>
                </div>
            </div>
        `
            )
            .join("");

    } catch (err) {
        console.error(err);
        container.innerHTML = "<p>Failed to load wishlist.</p>";
    }
}

loadWishlist();

/* --------------------------------------------------
   REMOVE FROM WISHLIST
-------------------------------------------------- */
window.removeFromWishlist = async function (productId) {
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

        alert("Moved to cart!");
        loadWishlist();
    } catch (err) {
        console.error(err);
        alert("Failed to move to cart");
    }
};
