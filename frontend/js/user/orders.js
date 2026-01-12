import { apiRequest } from "../api.js";

let allOrders = [];
let currentFilter = 'all';

/* --------------------------------------------------
   INIT
-------------------------------------------------- */
async function init() {
    await loadOrders();
}

init();

/* --------------------------------------------------
   LOAD ORDERS
-------------------------------------------------- */
async function loadOrders() {
    const container = document.getElementById("ordersContainer");

    try {
        const data = await apiRequest("/orders/");
        // Reverse to show newest first
        allOrders = data.reverse();

        updateCounts();
        renderOrders(allOrders);

    } catch (err) {
        console.error(err);
        container.innerHTML = `<p style="text-align:center; color:red">Failed to load orders: ${err.message}</p>`;
    }
}

/* --------------------------------------------------
   RENDER ORDERS
-------------------------------------------------- */
async function renderOrders(orders) {
    const container = document.getElementById("ordersContainer");

    if (orders.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#6b7280; margin-top:40px;">No orders found.</p>`;
        return;
    }

    // Prepare HTML (Fetch product details in parallel if needed, or use order snapshot)
    // Using snapshot from order items usually better for performance

    const htmlPromises = orders.map(async (order) => {
        const item = order.items?.[0] || {};
        const date = new Date(order.created_at).toLocaleDateString("en-GB", {
            day: 'numeric', month: 'short', year: 'numeric'
        });

        // Status Formatting
        let statusClass = "status-pending"; // default
        if (order.status === "shipped") statusClass = "status-shipped";
        if (order.status === "delivered") statusClass = "status-delivered";
        if (order.status === "cancelled") statusClass = "status-cancelled";

        // Payment Method Map
        const payMethod = order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment';

        return `
            <div class="order-row">
                <img src="${item.image || '../img/default.jpg'}" class="order-thumb" alt="Product">
                
                <div class="order-details">
                    <h3>${item.title}</h3>
                    <div class="order-meta">
                        Order ID: <span style="font-family:monospace">${order.order_number}</span> &bull; 
                        Date: ${date}
                    </div>
                    <div class="order-meta">
                        Payment: ${payMethod}
                    </div>
                    <div class="price">₹${order.total}</div>
                </div>

                <div class="order-actions">
                    <span class="order-status ${statusClass}">${order.status}</span>
                    
                    <a href="order-success.html?order_id=${order.order_id}" class="btn btn-outline">
                         Details
                    </a>
                    
                    ${order.status === 'pending' ? `
                        <button class="btn btn-danger" onclick="cancelOrder('${order.order_id}')">
                            Cancel Order
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    });

    const rows = await Promise.all(htmlPromises);
    container.innerHTML = rows.join("");
}

/* --------------------------------------------------
   FILTER TABS
-------------------------------------------------- */
window.filterOrders = function (status, tabElement) {
    currentFilter = status;

    // Update active tab
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tabElement.classList.add('active');

    // Filter
    if (status === 'all') {
        renderOrders(allOrders);
    } else {
        const filtered = allOrders.filter(o => o.status === status);
        renderOrders(filtered);
    }
};

/* --------------------------------------------------
   SEARCH
-------------------------------------------------- */
window.searchOrders = function () {
    const term = document.getElementById("searchInput").value.toLowerCase();

    const filtered = allOrders.filter(o =>
        o.order_number.toLowerCase().includes(term) ||
        (o.items[0]?.title || "").toLowerCase().includes(term) ||
        o.status.includes(term)
    );

    renderOrders(filtered);
};

/* --------------------------------------------------
   UPDATE COUNTS
-------------------------------------------------- */
function updateCounts() {
    const all = allOrders.length;
    const pending = allOrders.filter(o => o.status === 'pending').length;
    const shipped = allOrders.filter(o => o.status === 'shipped').length;
    const cancelled = allOrders.filter(o => o.status === 'cancelled').length;

    document.getElementById("count-all").textContent = all;
    document.getElementById("count-pending").textContent = pending;
    document.getElementById("count-shipped").textContent = shipped;
    document.getElementById("count-cancelled").textContent = cancelled;
}

/* --------------------------------------------------
   CANCEL ORDER
-------------------------------------------------- */
window.cancelOrder = async function (orderId) {
    if (!confirm("Are you sure you want to cancel this order?")) return;

    try {
        await apiRequest(`/orders/${orderId}/cancel`, "PUT"); // Assuming endpoint exists or DELETE
        // Or if you use DELETE for cancel:
        // await apiRequest(`/orders/${orderId}`, "DELETE"); 

        // Refresh
        await loadOrders();
        alert("Order cancelled successfully");

    } catch (err) {
        alert("Failed to cancel order: " + err.message);
    }
};

