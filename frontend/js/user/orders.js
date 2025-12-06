import { apiRequest } from "../api.js";

const ordersList = document.getElementById("ordersList");

/* --------------------------------------------------
   STATUS ICON FUNCTION
-------------------------------------------------- */
function getStatusIcon(status) {
    switch (status) {
        case "delivered":
            return `<span style="color:green; font-weight:bold;">✔ Delivered</span>`;
        case "cancelled":
            return `<span style="color:red; font-weight:bold;">✖ Cancelled</span>`;
        default:
            return `<span style="color:orange; font-weight:bold;">⏳ ${status}</span>`;
    }
}

/* --------------------------------------------------
   LOAD ORDERS
-------------------------------------------------- */
async function loadOrders() {
    try {
        const orders = await apiRequest("/orders/");

        if (!orders.length) {
            ordersList.innerHTML = "<p>No orders yet.</p>";
            return;
        }

        const html = await Promise.all(
            orders.map(async (order) => {
                const item = order.items?.[0];
                if (!item) return "";

                const productId = item.product_id;

                let product = {};
                try {
                    product = await apiRequest(`/user/products/${productId}`);
                } catch {
                    console.warn("Missing product", productId);
                }

                return `
                    <div class="order-card" data-order-id="${order.order_id}">
                        <div class="order-product">
                            <img src="${product.image || '../img/default.jpg'}" class="order-thumb">

                            <div class="order-prod-info">
                                <p class="prod-title">${product.title || item.title}</p>
                                <p class="prod-qty">Qty: ${item.quantity}</p>
                                <p class="prod-price">₹${item.price}</p>
                            </div>
                        </div>

                        <p><span class="label">Order #:</span> ${order.order_number}</p>

                        <p><span class="label">Status:</span> ${getStatusIcon(order.status)}</p>

                        <a href="order-success.html?order_id=${order.order_id}" class="btn-view">
                            View Details
                        </a>

                        <button class="btn-wishlist" data-product-id="${productId}" onclick="moveToWishlist(event)">
                            Move to Wishlist
                        </button>

                        <button class="btn-delete" onclick="deleteMyOrder('${order.order_id}')">
                            Delete
                        </button>
                    </div>
                `;
            })
        );

        ordersList.innerHTML = html.join("");

    } catch (err) {
        console.error(err);
        ordersList.innerHTML = "<p>Failed to load orders.</p>";
    }
}

loadOrders();

/* --------------------------------------------------
   DELETE ORDER
-------------------------------------------------- */
window.deleteMyOrder = async function (orderId) {
    if (!confirm("Delete this order?")) return;

    try {
        await apiRequest(`/orders/${orderId}`, "DELETE");
        alert("Order deleted!");
        loadOrders();
    } catch (err) {
        console.error(err);
        alert("Failed to delete order");
    }
};

/* --------------------------------------------------
   MOVE PRODUCT TO WISHLIST
-------------------------------------------------- */
window.moveToWishlist = async function (event) {
    const btn = event.currentTarget;
    const productId = btn.dataset.productId;
    const card = btn.closest(".order-card");

    const orderId = card.dataset.orderId;

    try {
        await apiRequest(`/wishlist/add/${productId}`, "POST");
        await apiRequest(`/orders/item/${orderId}/${productId}`, "DELETE");

        alert("Moved to wishlist!");
        loadOrders();
    } catch (err) {
        console.error(err);
        alert("Failed to move to wishlist");
    }
};
