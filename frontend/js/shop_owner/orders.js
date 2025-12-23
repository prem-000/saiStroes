import { apiRequest } from "../api.js";

// ----------------------------------------------
// AUTH CHECK
// ----------------------------------------------
const token = localStorage.getItem("shop_owner_token");
if (!token) {
    window.location.href = "login.html";
}

// ----------------------------------------------
// LOAD ORDERS
// ----------------------------------------------
async function loadOrders() {
    const list = document.getElementById("ordersList");
    if (!list) return;

    list.innerHTML = "";

    try {
        const orders = await apiRequest("/shop-owner/orders/");

        if (!Array.isArray(orders) || orders.length === 0) {
            list.innerHTML = `<p class="muted">No orders found</p>`;
            return;
        }

        orders.forEach(order => {
            const card = document.createElement("div");
            card.classList.add("order-card");

            // store order id
            card.dataset.orderId = order.id;

            const qty = order.items?.reduce((sum, it) => sum + it.quantity, 0) || 0;
            const amt = order.items?.reduce(
                (sum, it) => sum + it.quantity * it.price,
                0
            ) || 0;

            const user = order.user || {};
            const username = user.name || "Unknown";
            const userphone = user.phone || "Unknown";

            const createdAt = order.created_at
                ? new Date(order.created_at).toLocaleString()
                : "Unknown";

            card.innerHTML = `
                <h3>Order #${order.order_number}</h3>

                <p><b>Customer:</b> ${username}</p>
                <p><b>Phone:</b> ${userphone}</p>

                <p><b>Total Items:</b> ${qty}</p>
                <p><b>Amount:</b> ₹${amt}</p>

                <p><b>Date:</b> ${createdAt}</p>

                <span class="status-pill status-${order.status}">
                    ${order.status}
                </span>
            `;

            card.addEventListener("click", () => {
                window.location.href = `order_view.html?id=${order.id}`;
            });

            list.appendChild(card);
        });

    } catch (err) {
        console.error(err);
        list.innerHTML = `<p>Error loading orders</p>`;
    }
}

// ----------------------------------------------
// INIT
// ----------------------------------------------
loadOrders();
