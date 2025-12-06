import { apiRequest } from "../api.js";

const params = new URLSearchParams(window.location.search);
const orderId = params.get("order_id");

const orderBox = document.getElementById("orderInfo");
const itemsBody = document.getElementById("itemsBody");
const addressBox = document.getElementById("addressBox");
const heading = document.getElementById("orderStatusHeading");

async function loadOrder() {
    if (!orderId) {
        orderBox.innerHTML = "<b>Invalid order ID</b>";
        return;
    }

    try {
        const order = await apiRequest(`/orders/${orderId}`);

        const status = order.status.toLowerCase();

        // -----------------------------
        // ICON ONLY STATUS DISPLAY
        // -----------------------------
        if (heading) {
            if (status === "delivered") {
                heading.innerHTML = "✔";  
                heading.style.color = "green";
                heading.style.fontSize = "50px";
            }
            else if (status === "cancelled") {
                heading.innerHTML = "✖";
                heading.style.color = "red";
                heading.style.fontSize = "50px";
            }
            else {
                heading.innerHTML = "⏳";  
                heading.style.color = "orange";
                heading.style.fontSize = "50px";
            }
        }

        // -----------------------------
        // ORDER INFO
        // -----------------------------
        orderBox.innerHTML = `
            <p><b>Order Number:</b> ${order.order_number}</p>
            <p><b>Status:</b> ${order.status}</p>
            <p><b>Subtotal:</b> ₹${order.cart_total}</p>
            <p><b>Delivery:</b> ₹${order.delivery}</p>
            <p><b>Total Amount:</b> <b>₹${order.total}</b></p>
            <p><b>Date:</b> ${new Date(order.created_at).toLocaleString()}</p>
        `;

        // -----------------------------
        // ADDRESS
        // -----------------------------
        if (order.user_profile) {
            const u = order.user_profile;
            addressBox.innerHTML = `
                <p>${u.name}</p>
                <p>${u.phone}</p>
                <p>${u.address}, ${u.city}, ${u.state} - ${u.pincode}</p>
            `;
        }

        // -----------------------------
        // ITEMS TABLE
        // -----------------------------
        let rows = "";
        order.items.forEach(it => {
            rows += `
                <tr>
                    <td>${it.title}</td>
                    <td>${it.quantity}</td>
                    <td>₹${it.price}</td>
                    <td>₹${it.quantity * it.price}</td>
                </tr>
            `;
        });
        itemsBody.innerHTML = rows;

    } catch (err) {
        console.error(err);
        orderBox.innerHTML = "<b>Failed to load order details</b>";
    }
}

loadOrder();
