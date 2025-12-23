import { apiRequest } from "../api.js";

// ----------------------------------------------
// AUTH CHECK
// ----------------------------------------------
const token = localStorage.getItem("shop_owner_token");
if (!token) {
    window.location.href = "login.html";
}

const id = new URLSearchParams(window.location.search).get("id");

// -------------------------------------------------------
// LOAD ORDER DETAILS
// -------------------------------------------------------
async function loadOrder() {
    try {
        const o = await apiRequest(`/shop-owner/orders/${id}`);

        // BASIC ORDER INFO
        document.getElementById("orderId").textContent = o.order_number;
        document.getElementById("orderDate").textContent =
            new Date(o.created_at).toLocaleString();
        document.getElementById("orderStatus").textContent = o.status;

        // CUSTOMER DETAILS
        const user = o.user || {};

        document.getElementById("custName").textContent =
            user.name || "Not available";
        document.getElementById("custPhone").textContent =
            user.phone || "Not available";

        document.getElementById("custAddress").textContent =
            `${user.address || ""} ${user.city || ""} ${user.state || ""} ${user.pincode || ""}`.trim();

        // ORDER ITEMS TABLE
        let body = "";
        (o.items || []).forEach(it => {
            body += `
                <tr>
                    <td>${it.title}</td>
                    <td>${it.quantity}</td>
                    <td>₹${it.price}</td>
                    <td>₹${it.quantity * it.price}</td>
                </tr>
            `;
        });

        document.getElementById("itemsBody").innerHTML = body;

    } catch (err) {
        alert("Failed to load order");
        console.error(err);
    }
}

// -------------------------------------------------------
// UPDATE STATUS
// -------------------------------------------------------
window.updateStatus = async function () {
    const newStatus = document.getElementById("statusSelect").value;

    try {
        await apiRequest(
            `/shop-owner/orders/${id}/status`,
            "PUT",
            { status: newStatus }
        );

        alert("Status updated!");
        loadOrder(); // refresh

    } catch (err) {
        alert("Failed to update status");
        console.error(err);
    }
};

// -------------------------------------------------------
// INIT
// -------------------------------------------------------
loadOrder();
