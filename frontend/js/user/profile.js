import { apiRequest } from "../api.js";

// -------------------------------
// ELEMENTS
// -------------------------------
const nameEl = document.getElementById("p_name");
const phoneEl = document.getElementById("p_phone");
const addressEl = document.getElementById("p_address");
const pincodeEl = document.getElementById("p_pincode");
const cityEl = document.getElementById("p_city");
const stateEl = document.getElementById("p_state");
const saveBtn = document.getElementById("saveBtn");
const infoBox = document.getElementById("infoSection");

// -------------------------------
// LOAD PROFILE
// -------------------------------
async function loadProfile() {
  try {
    const profile = await apiRequest("/profile/me");
    if (!profile) return;

    nameEl.value = profile.name ?? "";
    phoneEl.value = profile.phone ?? "";
    addressEl.value = profile.address ?? "";
    pincodeEl.value = profile.pincode ?? "";
    cityEl.value = profile.city ?? "";
    stateEl.value = profile.state ?? "";
  } catch (err) {
    console.error("Failed to load profile:", err);
  }
}

// -------------------------------
// SAVE PROFILE (NETWORK-BASED)
// -------------------------------
async function saveProfile() {
  const payload = {
    name: nameEl.value.trim(),
    phone: phoneEl.value.trim(),
    address: addressEl.value.trim(),
    pincode: pincodeEl.value.trim(),
    city: cityEl.value.trim(),
    state: stateEl.value.trim(),
  };

  if (!payload.name || !payload.phone || !payload.address) return;

  // enter loading state
  saveBtn.classList.add("loading");

  try {
    await apiRequest("/profile/update", "POST", payload);

    // success feedback (no alert)
    saveBtn.classList.add("success");
    setTimeout(() => saveBtn.classList.remove("success"), 1200);
  } catch (err) {
    console.error("Profile update failed:", err);
  } finally {
    // exit loading ONLY after network finishes
    saveBtn.classList.remove("loading");
  }
}

// single event listener (important)
saveBtn.addEventListener("click", saveProfile);

// -------------------------------
// FAQ TOGGLE
// -------------------------------
window.toggleFAQ = function () {
  const faq = document.getElementById("faqSection");
  faq.style.display = faq.style.display === "none" ? "block" : "none";
  infoBox.style.display = "none";
};

document.addEventListener("click", (e) => {
  if (!e.target.classList.contains("faq-question")) return;
  const ans = e.target.nextElementSibling;
  ans.style.display = ans.style.display === "block" ? "none" : "block";
});

// -------------------------------
// ABOUT SECTION
// -------------------------------
window.showAbout = function () {
  infoBox.style.display = "block";
  infoBox.innerHTML = `
    <h4>About Sai Stores</h4>
    <p>Sai Stores provides quality products with faster delivery.</p>
    <p>All payments are handled securely using Razorpay.</p>
  `;
  document.getElementById("faqSection").style.display = "none";
};

// -------------------------------
// FEEDBACK SECTION
// -------------------------------
window.showFeedback = function () {
  infoBox.style.display = "block";
  infoBox.innerHTML = `
    <h4>Feedback</h4>
    <p>Contact us at:</p>
    <p><b>support@sai-stores.com</b></p>
  `;
  document.getElementById("faqSection").style.display = "none";
};

// -------------------------------
// OTHER ACTIONS
// -------------------------------
window.goToCart = () => (window.location.href = "cart.html");

window.logout = () => {
  localStorage.removeItem("user_token");
  window.location.href = "login.html";
};

// -------------------------------
// THEME TOGGLE
// -------------------------------
const toggle = document.getElementById("themeToggle");
const root = document.documentElement;

const savedTheme = localStorage.getItem("theme");
if (savedTheme) root.setAttribute("data-theme", savedTheme);

function updateIcon() {
  toggle.textContent =
    root.getAttribute("data-theme") === "dark" ? "☀️" : "🌙";
}

updateIcon();

toggle.onclick = () => {
  const next =
    root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
  updateIcon();
};

// INIT
loadProfile();
