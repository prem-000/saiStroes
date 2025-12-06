import { API_BASE } from "../api.js";


// ----------------------------------------------
// SAFE OWNER REQUEST
// ----------------------------------------------
async function ownerRequest(url, method = "GET", data = null) {
    const token = localStorage.getItem("shop_owner_token");
    if (!token) window.location.href = "login.html";

    const options = {
        method,
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token
        }
    };

    if (data) options.body = JSON.stringify(data);

    const res = await fetch(API_BASE + url, options);
    const json = await res.json();

    if (!res.ok) throw new Error(json.detail || "Request failed");
    return json;
}


// ----------------------------------------------
// LOAD ORDERS
// ----------------------------------------------
async function loadOrders() {
    const list = document.getElementById("ordersList");
    list.innerHTML = "";

    try {
        const orders = await ownerRequest("/shop-owner/orders/");

        if (!orders.length) {
            list.innerHTML = `<p class="muted">No orders found</p>`;
            return;
        }

        orders.forEach(order => {
            const card = document.createElement("div");
            card.classList.add("order-card");

            // Store order id in DOM (important)
            card.dataset.orderId = order.id;

            // Total items, amount
            const qty = order.items.reduce((sum, it) => sum + it.quantity, 0);
            const amt = order.items.reduce((sum, it) => sum + (it.quantity * it.price), 0);

            // User details
            const user = order.user || {};
            const username = user.name || "Unknown";
            const userphone = user.phone || "Unknown";

            // Date handling
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
                <span class="status-pill status-${order.status}">${order.status}</span>
            `;

            // open view page
            card.addEventListener("click", () => {
                window.location.href = `order_view.html?id=${order.id}`;
            });

            list.appendChild(card);
        });

    } catch (err) {
        console.error(err);
        list.innerHTML = `<p>Error loading orders: ${err.message}</p>`;
    }
}

loadOrders();
