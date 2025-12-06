import { apiRequest } from "../api.js";

const itemsBox = document.getElementById("checkoutItems");
const subtotalEl = document.getElementById("subtotal");
const deliveryEl = document.getElementById("delivery");
const totalEl = document.getElementById("total");
const noteEl = document.getElementById("note");

// NEW BUTTONS
const codBtn = document.getElementById("codBtn");
const onlinePayBtn = document.getElementById("onlinePayBtn");

function INR(n) {
    return "₹" + Number(n).toLocaleString("en-IN");
}

/* ----------------------------------------------------
   LOAD SUMMARY
---------------------------------------------------- */
async function loadSummary() {
    itemsBox.innerHTML = `<p class="muted">Loading items...</p>`;

    try {
        const data = await apiRequest("/checkout/summary");

        if (!data.items?.length) {
            itemsBox.innerHTML = `<p class="muted">Your cart is empty.</p>`;
            codBtn.disabled = true;
            onlinePayBtn.disabled = true;
            return;
        }

        itemsBox.innerHTML = data.items
            .map(
                (i) => `
            <div class="checkout-item">
                <img src="${i.image || './default.jpg'}" class="thumb">
                <div class="meta">
                    <p>${i.title}</p>
                    <p class="muted">₹${i.price} × ${i.quantity} = ₹${i.price * i.quantity}</p>
                </div>
            </div>`
            )
            .join("");

        subtotalEl.textContent = INR(data.subtotal);
        deliveryEl.textContent = INR(data.delivery);
        totalEl.textContent = INR(data.total);
    } catch (err) {
        itemsBox.innerHTML = `<p class="muted">Unable to load checkout summary.</p>`;
        codBtn.disabled = true;
        onlinePayBtn.disabled = true;
    }
}

/* ----------------------------------------------------
   PROFILE POPUP HANDLING
---------------------------------------------------- */
async function askForProfile() {
    return new Promise((resolve) => {
        const modal = document.getElementById("profileModal");
        modal.style.display = "block";

        document.getElementById("saveProfileBtn").onclick = async () => {
            const profile = {
                name: p_name.value.trim(),
                phone: p_phone.value.trim(),
                address: p_address.value.trim(),
                pincode: p_pincode.value.trim(),
                city: p_city.value.trim(),
                state: p_state.value.trim(),
            };

            if (!profile.name || !profile.phone || !profile.address) {
                alert("Please complete all required fields.");
                return;
            }

            try {
                await apiRequest("/profile/update", "POST", profile);
                modal.style.display = "none";
                resolve();
            } catch {
                alert("Could not update profile.");
            }
        };
    });
}

function isProfileMissing(err) {
    return JSON.stringify(err).includes("Profile missing");
}

/* ----------------------------------------------------
   CREATE ORDER (Common function)
---------------------------------------------------- */
async function createOrder(payment_method) {
    const note = noteEl.value?.trim() || null;

    try {
        return await apiRequest("/checkout/create-order", "POST", {
            note,
            payment_method
        });
    } catch (err) {
        if (isProfileMissing(err)) {
            await askForProfile();
            return await apiRequest("/checkout/create-order", "POST", {
                note,
                payment_method
            });
        }
        throw err;
    }
}

/* ----------------------------------------------------
   CASH ON DELIVERY
---------------------------------------------------- */
codBtn.addEventListener("click", async () => {
    codBtn.disabled = true;
    codBtn.textContent = "Placing order…";

    try {
        const order = await createOrder("cod");
        window.location.href = `order-success.html?id=${order.order_id}`;
    } catch {
        alert("Failed to place order.");
    } finally {
        codBtn.disabled = false;
        codBtn.textContent = "Cash on Delivery";
    }
});

/* ----------------------------------------------------
   ONLINE PAYMENT (RAZORPAY)
---------------------------------------------------- */
onlinePayBtn.addEventListener("click", async () => {
    onlinePayBtn.disabled = true;
    onlinePayBtn.textContent = "Preparing payment…";

    try {
        const order = await createOrder("online");
        const orderId = order.order_id;

        const razorResp = await apiRequest(`/pay/create/${orderId}`, "POST");

        await loadRazorpayScript();

        new window.Razorpay({
            key: razorResp.razorpay_key,
            amount: razorResp.amount * 100,
            currency: "INR",
            name: "SAI STORES",
            description: `Order ${order.order_number}`,
            order_id: razorResp.razorpay_order_id,

            handler: (resp) => {
                window.location.href =
                    `order-success.html?id=${orderId}&payment_id=${resp.razorpay_payment_id}`;
            },

            modal: {
                ondismiss: () => {
                    onlinePayBtn.disabled = false;
                    onlinePayBtn.textContent = "Pay Online";
                },
            },
        }).open();
    } catch (err) {
        alert("Payment failed.");
        onlinePayBtn.disabled = false;
        onlinePayBtn.textContent = "Pay Online";
    }
});

/* ----------------------------------------------------
   LOAD RAZORPAY SCRIPT
---------------------------------------------------- */
function loadRazorpayScript() {
    return new Promise((resolve, reject) => {
        if (window.Razorpay) return resolve();

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = resolve;
        script.onerror = () => reject("Failed to load Razorpay");

        document.head.appendChild(script);
    });
}

loadSummary();
