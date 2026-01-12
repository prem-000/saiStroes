import { apiRequest } from "../api.js";

// ----------------------------------------------
// AUTH + ORDER ID
// ----------------------------------------------
const token = localStorage.getItem("shop_owner_token");
if (!token) window.location.href = "login.html";

const id = new URLSearchParams(window.location.search).get("id");
if (!id) window.location.href = "orders.html";

// ----------------------------------------------
// ELEMENTS
// ----------------------------------------------
const statusSelect = document.getElementById("statusSelect");
const updateBtn = document.querySelector(".btn-primary");
const msgBox = document.createElement("p");
updateBtn.after(msgBox);

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
    "pending": "Customer placed order.",
    "accepted": "You accepted the order.",
    "packed": "Item packed.",
    "shipped": "On the way.",
    "delivered": "Delivered to customer.",
    "cancelled": "Order was cancelled."
};

// ----------------------------------------------
// MAP VARS
// ----------------------------------------------
let map, shopMarker, userMarker, routeLine;

// ----------------------------------------------
// DISTANCE HELPER
// ----------------------------------------------
function getDistanceKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;

    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2);
}

// ----------------------------------------------
// MAP INIT
// ----------------------------------------------
function initMap() {
    if (map) return;

    map = L.map("orderMap").setView([20.5937, 78.9629], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap"
    }).addTo(map);
}

// ----------------------------------------------
// SHOW ROUTE
// ----------------------------------------------
function showRoute(shopLoc, userLoc) {
    initMap();

    if (shopMarker) map.removeLayer(shopMarker);
    if (userMarker) map.removeLayer(userMarker);
    if (routeLine) map.removeLayer(routeLine);

    shopMarker = L.marker([shopLoc.lat, shopLoc.lng])
        .addTo(map)
        .bindPopup("Your Shop");

    userMarker = L.marker([userLoc.lat, userLoc.lng])
        .addTo(map)
        .bindPopup("Customer");

    routeLine = L.polyline(
        [
            [shopLoc.lat, shopLoc.lng],
            [userLoc.lat, userLoc.lng]
        ],
        { color: "blue", weight: 4 }
    ).addTo(map);

    map.fitBounds(routeLine.getBounds(), { padding: [30, 30] });
}

// ----------------------------------------------
// RENDER TIMELINE
// ----------------------------------------------
function renderTimeline(status) {
    const timelineBox = document.getElementById("trackingTimeline");
    if (!timelineBox) return;

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

    let html = "";
    STAGES.forEach((stage) => {
        let stateClass = "";
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

// ----------------------------------------------
// LOAD ORDER
// ----------------------------------------------
async function loadOrder() {
    try {
        const o = await apiRequest(`/shop-owner/orders/${id}`);

        document.getElementById("orderId").textContent = o.order_number;
        document.getElementById("orderDate").textContent =
            new Date(o.created_at).toLocaleString();
        document.getElementById("orderStatus").textContent = o.status;

        // RENDER TIMELINE
        renderTimeline(o.status.toLowerCase());

        // PAYMENT
        const pay = o.payment || {};
        document.getElementById("paymentMethod").textContent =
            pay.method === "online" ? "Online Payment" : "Cash on Delivery";
        document.getElementById("paymentStatus").textContent =
            pay.status || "pending";
        document.getElementById("paidAmount").textContent =
            "₹" + (pay.paid_amount ?? 0);
        document.getElementById("paymentNote").textContent =
            pay.method === "cod"
                ? "Collect cash from customer"
                : "Paid online — settlement pending";

        // CUSTOMER
        const user = o.user || {};
        document.getElementById("custName").textContent = user.name || "N/A";
        document.getElementById("custPhone").textContent = user.phone || "N/A";
        document.getElementById("custAddress").textContent =
            `${user.address || ""} ${user.city || ""} ${user.pincode || ""}`;

        // ITEMS
        document.getElementById("itemsBody").innerHTML =
            (o.items || []).map(it => `
                <tr>
                    <td>${it.title}</td>
                    <td>${it.quantity}</td>
                    <td>₹${it.price}</td>
                    <td>₹${it.quantity * it.price}</td>
                </tr>
            `).join("");

        // DISTANCE + MAP
        if (o.shop_location && o.user_location) {
            const d = getDistanceKm(
                o.shop_location.lat,
                o.shop_location.lng,
                o.user_location.lat,
                o.user_location.lng
            );
            document.getElementById("orderDistance").textContent =
                `${d} km from your shop`;

            showRoute(o.shop_location, o.user_location);
        } else {
            document.getElementById("orderDistance").textContent =
                "Location not available";
        }

    } catch {
        msgBox.textContent = "Failed to load order";
    }
}

// ----------------------------------------------
// UPDATE STATUS
// ----------------------------------------------
window.updateStatus = async function () {
    try {
        await apiRequest(
            `/shop-owner/orders/${id}/status`,
            "PUT",
            { status: statusSelect.value }
        );
        await loadOrder();
    } catch {
        msgBox.textContent = "Status update failed";
    }
};

// ----------------------------------------------
// INIT
// ----------------------------------------------
loadOrder();
