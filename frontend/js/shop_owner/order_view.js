import { API_BASE } from "../api.js";

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

const id = new URLSearchParams(window.location.search).get("id");

/* -------------------------------------------------------
   LOAD ORDER DETAILS
------------------------------------------------------- */
async function loadOrder() {
    try {
        const o = await ownerRequest(`/shop-owner/orders/${id}`);

        // BASIC ORDER INFO
        document.getElementById("orderId").textContent = o.order_number;
        document.getElementById("orderDate").textContent =
            new Date(o.created_at).toLocaleString();
        document.getElementById("orderStatus").textContent = o.status;

        // CUSTOMER DETAILS
        const user = o.user || {};

        document.getElementById("custName").textContent = user.name || "Not available";
        document.getElementById("custPhone").textContent = user.phone || "Not available";

        document.getElementById("custAddress").textContent =
            `${user.address || ""} ${user.city || ""} ${user.state || ""} ${user.pincode || ""}`.trim();

        // ORDER ITEMS TABLE
        let body = "";
        o.items.forEach(it => {
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
        alert("Failed to load order: " + err.message);
    }
}

/* -------------------------------------------------------
   UPDATE STATUS  (FIXED)
------------------------------------------------------- */
window.updateStatus = async function () {
    const newStatus = document.getElementById("statusSelect").value;

    try {
        await ownerRequest(
            `/shop-owner/orders/${id}/status`,
            "PUT",
            { status: newStatus }   // FIXED
        );

        alert("Status updated!");
        loadOrder();  // refresh

    } catch (err) {
        alert(err.message);
    }
};

loadOrder();
