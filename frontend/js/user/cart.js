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
                <div style="font-weight:600">${item.title}</div>
                <div>${INR(item.price)}</div>
                
                <div class="qty-ctrl" style="margin-top:8px; width:fit-content">
                   <button class="qty-btn" onclick="changeQuantity('${item.product_id}', ${item.quantity - 1})">−</button>
                   <span class="qty-num">${item.quantity}</span>
                   <button class="qty-btn" onclick="changeQuantity('${item.product_id}', ${item.quantity + 1})">+</button>
                </div>

                <button class="btn-ghost" onclick="removeItem('${item.product_id}')" style="margin-top:8px; padding:4px 8px; font-size:12px; border-radius:6px">Remove</button>
            </div>
        </div>
    `
        )
        .join("");

    subtotalEl.textContent = INR(data.cart_total);

    // Delivery is dynamic base on distance (calculated at checkout)
    deliveryEl.textContent = "Calculated at checkout";
    deliveryEl.style.fontSize = "12px";
    deliveryEl.style.color = "#666";

    // Just show subtotal as total for now, or keep total same as subtotal
    totalEl.textContent = INR(data.cart_total);
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

/* --------------------------------------------------
   CHANGE QUANTITY
---------------------------------------------------- */
window.changeQuantity = async function (id, qty) {
    try {
        await apiRequest(`/cart/update-quantity?product_id=${id}&quantity=${qty}`, "PUT");
        await loadCart();
    } catch (err) {
        console.error("Change quantity failed:", err);
    }
};
