import { apiRequest } from "../api.js";

// DOM elements
const itemsList = document.getElementById("itemsList");
const subtotalEl = document.getElementById("subtotal");
const deliveryEl = document.getElementById("delivery");
const totalEl = document.getElementById("total");
const clearBtn = document.getElementById("clearBtn");

/* --------------------------------------------------
   FORMAT CURRENCY
-------------------------------------------------- */
function INR(n) {
    return "₹" + Number(n).toLocaleString("en-IN");
}

/* --------------------------------------------------
   UPDATE CART BADGE
-------------------------------------------------- */
async function updateCartCount() {
    const badge = document.getElementById("cartCount");
    if (!badge) return;  // Badge not in this page

    try {
        const data = await apiRequest("/cart/");
        console.debug("Cart count fetch:", data);

        const count = Array.isArray(data.items) ? data.items.length : 0;
        badge.textContent = count;
    } catch (err) {
        console.error("updateCartCount failed:", err);
        badge.textContent = 0;
    }
}

/* --------------------------------------------------
   LOAD CART
-------------------------------------------------- */
async function loadCart() {
    try {
        const data = await apiRequest("/cart/");
        renderCart(data);
        await updateCartCount();
    } catch (err) {
        console.error("Cart load failed:", err);
        itemsList.innerHTML = "<p>Please login to view cart.</p>";
    }
}

loadCart();

/* --------------------------------------------------
   RENDER CART UI
-------------------------------------------------- */
function renderCart(data) {
    if (!data.items.length) {
        itemsList.innerHTML = "<p>Your cart is empty.</p>";
        subtotalEl.textContent = "₹0";
        deliveryEl.textContent = "₹0";
        totalEl.textContent = "₹0";
        return;
    }

    itemsList.innerHTML = data.items
        .map(
            (item) => `
        <div class="cart-item">
            <img src="${item.image}" class="product-thumb">
            <div class="item-info">
                <div>${item.title}</div>
                <div>₹${item.price}</div>
                <button onclick="removeItem('${item.product_id}')">Remove</button>
            </div>
        </div>
    `
        )
        .join("");

    subtotalEl.textContent = INR(data.cart_total);

    const delivery = data.cart_total > 999 ? 0 : 49;
    deliveryEl.textContent = INR(delivery);

    totalEl.textContent = INR(data.cart_total + delivery);
}

/* --------------------------------------------------
   REMOVE SINGLE ITEM
-------------------------------------------------- */
window.removeItem = async function (id) {
    try {
        await apiRequest(`/cart/remove/${id}`, "DELETE");
        await loadCart();
        await updateCartCount();
    } catch (err) {
        console.error("Remove item failed:", err);
    }
};

/* --------------------------------------------------
   CLEAR CART
-------------------------------------------------- */
if (clearBtn) {
    clearBtn.addEventListener("click", async () => {
        if (!confirm("Clear your entire cart?")) return;

        try {
            await apiRequest("/cart/clear", "DELETE");
            await loadCart();
            await updateCartCount();
        } catch (err) {
            console.error("Clear cart failed:", err);
            alert("Failed to clear cart");
        }
    });
}


/* --------------------------------------------------
   CHECKOUT BUTTON
-------------------------------------------------- */
const checkoutBtn = document.getElementById("checkoutBtn");

if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
        window.location.href = "checkout.html";
    });
}
