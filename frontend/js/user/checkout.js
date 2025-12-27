import { apiRequest } from "../api.js";

/* ----------------------------------------------------
   DOM ELEMENTS
---------------------------------------------------- */
const itemsBox = document.getElementById("checkoutItems");
const subtotalEl = document.getElementById("subtotal");
const deliveryEl = document.getElementById("delivery");
const totalEl = document.getElementById("total");
const noteEl = document.getElementById("note");

const codBtn = document.getElementById("codBtn");
const onlinePayBtn = document.getElementById("onlinePayBtn");

/* ----------------------------------------------------
   HELPERS
---------------------------------------------------- */
function INR(n) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

function isLoggedIn() {
  return (
    localStorage.getItem("user_token") ||
    localStorage.getItem("shop_owner_token")
  );
}

/* ----------------------------------------------------
   LOGIN REQUIRED BUTTON ANIMATION
---------------------------------------------------- */
function loginRequiredAnimation(btn, originalText) {
  btn.classList.add("login-required");
  btn.textContent = "Login first";

  setTimeout(() => {
    btn.classList.remove("login-required");
    btn.textContent = originalText;
  }, 1500);
}

/* ----------------------------------------------------
   ORDER SUCCESS CONFETTI
---------------------------------------------------- */
function showOrderSuccessAnimation() {
  for (let i = 0; i < 20; i++) {
    const c = document.createElement("div");
    c.className = "confetti";

    c.style.left = Math.random() * window.innerWidth + "px";
    c.style.setProperty("--x", Math.random() * 200 - 100 + "px");
    c.style.background = ["#4caf50", "#ff9800", "#2196f3"][i % 3];

    document.body.appendChild(c);
    setTimeout(() => c.remove(), 2000);
  }
}

/* ----------------------------------------------------
   LOAD CHECKOUT SUMMARY
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
          <img src="${i.image || "./default.jpg"}" class="thumb">
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

  } catch {
    itemsBox.innerHTML = `<p class="muted">Unable to load checkout.</p>`;
    codBtn.disabled = true;
    onlinePayBtn.disabled = true;
  }
}

/* ----------------------------------------------------
   PROFILE POPUP (UNCHANGED)
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

      if (!profile.name || !profile.phone || !profile.address) return;

      try {
        await apiRequest("/profile/update", "POST", profile);
        modal.style.display = "none";
        resolve();
      } catch {}
    };
  });
}

function isProfileMissing(err) {
  return JSON.stringify(err).includes("Profile missing");
}

/* ----------------------------------------------------
   CREATE ORDER
---------------------------------------------------- */
async function createOrder(payment_method, btn, originalText) {
  if (!isLoggedIn()) {
    loginRequiredAnimation(btn, originalText);
    throw new Error("NOT_LOGGED_IN");
  }

  const note = noteEl.value?.trim() || null;

  try {
    return await apiRequest("/checkout/create-order", "POST", {
      note,
      payment_method,
    });
  } catch (err) {
    if (isProfileMissing(err)) {
      await askForProfile();
      return await apiRequest("/checkout/create-order", "POST", {
        note,
        payment_method,
      });
    }
    throw err;
  }
}

/* ----------------------------------------------------
   CASH ON DELIVERY
---------------------------------------------------- */
codBtn.addEventListener("click", async () => {
  const originalText = "Cash on Delivery";
  codBtn.disabled = true;
  codBtn.textContent = "Placing order…";

  try {
    const order = await createOrder("cod", codBtn, originalText);
    showOrderSuccessAnimation();

    setTimeout(() => {
      window.location.href = `order-success.html?id=${order.order_id}`;
    }, 1200);

  } catch {}

  codBtn.disabled = false;
  codBtn.textContent = originalText;
});

/* ----------------------------------------------------
   ONLINE PAYMENT
---------------------------------------------------- */
onlinePayBtn.addEventListener("click", async () => {
  const originalText = "Pay Online";
  onlinePayBtn.disabled = true;
  onlinePayBtn.textContent = "Preparing payment…";

  try {
    const order = await createOrder("online", onlinePayBtn, originalText);
    showOrderSuccessAnimation();

    const razorResp = await apiRequest(`/pay/create/${order.order_id}`, "POST");
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
          `order-success.html?id=${order.order_id}&payment_id=${resp.razorpay_payment_id}`;
      },

      modal: {
        ondismiss: () => {
          onlinePayBtn.disabled = false;
          onlinePayBtn.textContent = originalText;
        },
      },
    }).open();

  } catch {
    onlinePayBtn.disabled = false;
    onlinePayBtn.textContent = originalText;
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
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/* ----------------------------------------------------
   INIT
---------------------------------------------------- */
loadSummary();
