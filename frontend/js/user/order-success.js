import { apiRequest } from "../api.js";

const params = new URLSearchParams(window.location.search);
const orderId = params.get("order_id");

const heading = document.getElementById("orderStatusHeading");
const subText = document.getElementById("orderSubText");
const timelineBox = document.getElementById("trackingTimeline");
const addressBox = document.getElementById("addressBox");
const itemsBody = document.getElementById("itemsBody");

// ---------------------------------------------
// TIMELINE STAGES
// ---------------------------------------------
const STAGES = ["pending", "accepted", "packed", "shipped", "delivered"];
const LABELS = {
    "pending": "Order Placed",
    "accepted": "Order Accepted",
    "packed": "Packed",
    "shipped": "Shipped",
    "delivered": "Delivered",
    "cancelled": "Cancelled"
};
const DESCRIPTIONS = {
    "pending": "We have received your order.",
    "accepted": "Seller has accepted your order.",
    "packed": "Your item has been packed.",
    "shipped": "On the way to you.",
    "delivered": "Package delivered successfully.",
    "cancelled": "This order was cancelled."
};

async function loadOrder() {
    if (!orderId) {
        heading.innerText = "Error";
        subText.innerText = "Order ID missing";
        return;
    }

    try {
        const order = await apiRequest(`/orders/${orderId}`);
        const currentStatus = order.status.toLowerCase();

        // 1. HEADER
        heading.innerText = `Order #${order.order_number}`;
        subText.innerText = `Placed on ${new Date(order.created_at).toLocaleString()}`;

        // 2. TIMELINE
        renderTimeline(currentStatus, order.created_at);

        // 3. ITEMS
        renderItems(order.items);

        // 4. SUMMARY
        document.getElementById("summSub").innerText = "₹" + order.cart_total;
        document.getElementById("summDel").innerText = "₹" + order.delivery_fee;
        document.getElementById("summTotal").innerText = "₹" + order.total;

        // 5. ADDRESS
        if (order.user_profile) {
            const u = order.user_profile;
            addressBox.innerText = `${u.address || ""}, ${u.city || ""} - ${u.pincode || ""}`;
        }

    } catch (err) {
        console.error(err);
        heading.innerText = "Failed to load";
    }
}

function renderTimeline(status, dateStr) {
    if (status === "cancelled") {
        timelineBox.innerHTML = `
            <div class="timeline-item active">
                <div class="timeline-node" style="background:red; border-color:red"></div>
                <div class="timeline-status" style="color:red">Cancelled</div>
                <div class="timeline-desc">This order has been cancelled.</div>
            </div>
        `;
        return;
    }

    let foundActive = false;
    let html = "";

    STAGES.forEach((stage) => {
        let stateClass = "";

        // Logic: 
        // If we haven't reached 'active' yet, duplicate the previous state check?
        // Actually: 
        //   PENDING -> ACTIVE
        //   ACCEPTED -> COMPLETED (Pending) -> ACTIVE (Accepted)
        // Simple Index check
        const idxCurrent = STAGES.indexOf(status);
        const idxStage = STAGES.indexOf(stage);

        if (idxStage < idxCurrent) {
            stateClass = "completed";
        } else if (idxStage === idxCurrent) {
            stateClass = "active";
        }

        html += `
            <div class="timeline-item ${stateClass}">
                <div class="timeline-node"></div>
                <div class="timeline-date">
                     ${stateClass ? 'Completed' : 'Upcoming'}
                </div>
                <div class="timeline-status">${LABELS[stage]}</div>
                <div class="timeline-desc">${DESCRIPTIONS[stage]}</div>
            </div>
        `;
    });

    timelineBox.innerHTML = html;
}

function renderItems(items) {
    itemsBody.innerHTML = items.map(item => `
        <tr>
            <td>
                <img src="${item.image || '../img/default.jpg'}">
                ${item.title}
            </td>
            <td>${item.quantity}</td>
            <td>₹${item.price}</td>
            <td>₹${item.quantity * item.price}</td>
        </tr>
    `).join("");
}

loadOrder();
