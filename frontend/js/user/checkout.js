import { apiRequest } from "../api.js";

/* ----------------------------------------------------
   ELEMENTS
---------------------------------------------------- */
const itemsBox = document.getElementById("checkoutItems");
const subtotalEl = document.getElementById("subtotal");
const deliveryEl = document.getElementById("delivery");
const totalEl = document.getElementById("total");
const noteEl = document.getElementById("note");

const codBtn = document.getElementById("codBtn");
const onlinePayBtn = document.getElementById("onlinePayBtn");

const p_name = document.getElementById("p_name");
const p_phone = document.getElementById("p_phone");
const p_address = document.getElementById("p_address");
const p_city = document.getElementById("p_city");
const p_pincode = document.getElementById("p_pincode");
const p_state = document.getElementById("p_state");

/* ----------------------------------------------------
   STATE
---------------------------------------------------- */
let userLat = null;
let userLng = null;

/* ----------------------------------------------------
   HELPERS
---------------------------------------------------- */
const claimNewUser = document.getElementById("claimNewUser");
const couponMsg = document.getElementById("couponMsg");
const discountRow = document.getElementById("discountRow");
const discountVal = document.getElementById("discountVal");
const couponCode = document.getElementById("couponCode");
const deliveryMsg = document.getElementById("deliveryMsg");

const INR = (n) => "₹" + Number(n).toLocaleString("en-IN");

function renderSummary(data) {
  if (!data || !data.items) return;
  // Items
  itemsBox.innerHTML = data.items
    .map(
      (i) => `
        <div class="checkout-item" style="justify-content:space-between">
          <div style="display:flex; gap:12px; align-items:center">
             <img src="${i.image || "./default.jpg"}" class="thumb">
             <div class="meta">
               <p>${i.title}</p>
               <p class="muted">₹${i.price}</p>
             </div>
          </div>
          
          <div class="qty-ctrl">
             <button class="qty-btn" onclick="changeQuantity('${i.product_id}', ${i.quantity - 1})">−</button>
             <span class="qty-num">${i.quantity}</span>
             <button class="qty-btn" onclick="changeQuantity('${i.product_id}', ${i.quantity + 1})">+</button>
          </div>
        </div>
  `
    )
    .join("");

  // Breakdown
  subtotalEl.textContent = INR(data.cart_subtotal);
  deliveryEl.textContent = INR(data.delivery_fee);
  deliveryMsg.textContent = data.delivery_breakdown || "";

  if (data.discount > 0) {
    discountRow.style.display = "flex";
    discountVal.textContent = "-" + INR(data.discount);
    couponCode.textContent = data.discount_code || "OFFER";

    couponMsg.style.display = "block";
    couponMsg.style.color = "green";
    couponMsg.style.background = "#e6fffa";
    couponMsg.style.padding = "10px";
    couponMsg.style.marginTop = "10px";
    couponMsg.style.borderRadius = "8px";
    couponMsg.textContent = data.discount_msg;
  } else {
    discountRow.style.display = "none";
    couponMsg.style.display = "none";

    if (document.getElementById("claimNewUser").checked) {
      couponMsg.style.display = "block";
      couponMsg.style.color = "orange";
      couponMsg.style.background = "#fffaf0";
      couponMsg.textContent = data.discount_msg || "Offer not applicable";
    }
  }

  totalEl.textContent = INR(data.final_total);
}

// TOGGLE LISTENER
claimNewUser.addEventListener("change", () => {
  loadSummary();
});

/* ----------------------------------------------------
   LOAD CHECKOUT SUMMARY
---------------------------------------------------- */
async function loadSummary() {
  itemsBox.innerHTML = `<p class="muted">Loading checkout...</p>`;

  try {
    // 1. Get Profile for Location
    const profile = await apiRequest("/profile/me");

    // Populate contact
    if (profile.name) p_name.value = profile.name;
    if (profile.phone) p_phone.value = profile.phone;

    // Handle Location Variants
    if (profile.location && profile.location.lat) {
      userLat = profile.location.lat;
      userLng = profile.location.lng;
      // Nested address?
      if (profile.address) {
        p_address.value = profile.address.street || "";
        p_city.value = profile.address.city || "";
        p_pincode.value = profile.address.pincode || "";
        p_state.value = profile.address.state || "";
      }
    } else if (profile.lat) {
      userLat = profile.lat;
      userLng = profile.lng;
      // Flat address
      p_address.value = profile.address_line || "";
      p_city.value = profile.city || "";
      p_pincode.value = profile.pincode || "";
      p_state.value = profile.state || "";
    }

    // Validate Location
    if (!userLat || !userLng) {
      alert("Please set your delivery location in your Profile first!");
      window.location.href = "/frontend/user/profile.html";
      return;
    }

    // 2. Get Cart Summary (calculates fees based on profile location)
    const claim = document.getElementById("claimNewUser").checked;
    const data = await apiRequest(`/checkout/summary?claim_new_user=${claim}`);
    renderSummary(data);

  } catch (err) {
    console.error(err);
    itemsBox.innerHTML = `<p class="error">Checkout failed: ${err.message}</p>`;
    // Disable buttons
    codBtn.disabled = onlinePayBtn.disabled = true;
  }
}

/* ----------------------------------------------------
   CREATE ORDER
---------------------------------------------------- */
async function createOrder(payment_method) {
  const note = noteEl.value || null;

  // Final Validation
  if (!userLat || !userLng) {
    alert("Location missing!");
    return;
  }

  // Construct Address Object
  const deliveryAddress = {
    name: p_name.value,
    phone: p_phone.value,
    address_line: p_address.value,
    city: p_city.value,
    pincode: p_pincode.value,
    state: p_state.value,
    lat: parseFloat(userLat),
    lng: parseFloat(userLng)
  };

  const claimNewUser = document.getElementById("claimNewUser").checked;

  try {
    const order = await apiRequest("/orders/create", "POST", {
      payment_method,
      note,
      delivery_address: deliveryAddress,
      claim_new_user: claimNewUser
    });

    if (payment_method === "cod") {
      window.location.href = `order-success.html?id=${order.order_id}`;
    } else {
      window.location.href = `pay.html?id=${order.order_id}`;
    }

  } catch (err) {
    alert(err.message || "Order creation failed");
    codBtn.disabled = false;
    onlinePayBtn.disabled = false;
  }
}

/* ----------------------------------------------------
   EVENTS
---------------------------------------------------- */
codBtn.onclick = () => {
  codBtn.disabled = true;
  createOrder("cod");
};

onlinePayBtn.onclick = () => {
  onlinePayBtn.disabled = true;
  createOrder("online");
};

/* ----------------------------------------------------
   INIT
---------------------------------------------------- */
loadSummary();

/* ----------------------------------------------------
   CHANGE QUANTITY
---------------------------------------------------- */
window.changeQuantity = async function (productId, newQty) {
  try {
    await apiRequest(`/cart/update-quantity?product_id=${productId}&quantity=${newQty}`, "PUT");
    await loadSummary();
  } catch (err) {
    console.error("Update quantity failed:", err);
  }
};
