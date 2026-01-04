import { apiRequest } from "../api.js";

// ----------------------------------------------
// AUTH CHECK
// ----------------------------------------------
const token = localStorage.getItem("shop_owner_token");
if (!token) {
    window.location.href = "login.html";
}

// ----------------------------------------------
// GET ORDER ID
// ----------------------------------------------
const id = new URLSearchParams(window.location.search).get("id");
if (!id) {
    window.location.href = "orders.html";
}

// ----------------------------------------------
// ELEMENTS
// ----------------------------------------------
const statusSelect = document.getElementById("statusSelect");
const updateBtn = document.querySelector(".btn-primary");

// dynamic UI elements
const msgBox = document.createElement("p");
msgBox.className = "status-message";
updateBtn.after(msgBox);

// reason textarea (shown only on cancel)
const reasonBox = document.createElement("textarea");
reasonBox.id = "cancelReason";
reasonBox.placeholder = "Reason for cancellation (required)";
reasonBox.style.display = "none";
reasonBox.className = "cancel-reason";
statusSelect.before(reasonBox);

// ----------------------------------------------
// SHOW / HIDE REASON FIELD
// ----------------------------------------------
statusSelect.addEventListener("change", () => {
    if (statusSelect.value === "cancelled") {
        reasonBox.style.display = "block";
    } else {
        reasonBox.style.display = "none";
        reasonBox.value = "";
    }
});

// -------------------------------------------------------
// LOAD ORDER DETAILS
// -------------------------------------------------------
async function loadOrder() {
    try {
        const o = await apiRequest(`/shop-owner/orders/${id}`);

        document.getElementById("orderId").textContent = o.order_number;
        document.getElementById("orderDate").textContent =
            new Date(o.created_at).toLocaleString();
        document.getElementById("orderStatus").textContent = o.status;

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
                : "Paid online — will be settled to your bank";

        // CUSTOMER
        const user = o.user || {};
        document.getElementById("custName").textContent = user.name || "N/A";
        document.getElementById("custPhone").textContent = user.phone || "N/A";
        document.getElementById("custAddress").textContent =
            `${user.address || ""} ${user.city || ""} ${user.state || ""} ${user.pincode || ""}`.trim();

        // ITEMS
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
        msgBox.textContent = "Failed to load order.";
        msgBox.className = "status-message error";
    }
}

// -------------------------------------------------------
// UPDATE STATUS (NO ALERTS)
// -------------------------------------------------------
window.updateStatus = async function () {
    const newStatus = statusSelect.value;
    const reason = reasonBox.value.trim();

    // validation
    if (newStatus === "cancelled" && !reason) {
        msgBox.textContent = "Please provide a reason for cancellation.";
        msgBox.className = "status-message error";
        return;
    }

    // loading state
    updateBtn.disabled = true;
    updateBtn.innerHTML = `<span class="spinner"></span> Updating...`;
    msgBox.textContent = "";
    msgBox.className = "status-message";

    try {
        await apiRequest(
            `/shop-owner/orders/${id}/status`,
            "PUT",
            { status: newStatus, reason }
        );

        msgBox.textContent = "Status updated successfully.";
        msgBox.className = "status-message success";

        await loadOrder();

    } catch (err) {
        msgBox.textContent = "Failed to update status.";
        msgBox.className = "status-message error";
    } finally {
        updateBtn.disabled = false;
        updateBtn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Update`;
    }
};

// -------------------------------------------------------
// INIT
// -------------------------------------------------------
loadOrder();
