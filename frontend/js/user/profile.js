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

    } catch (error) {
        console.error("Failed to load profile:", error);
    }
}

// -------------------------------
// SAVE PROFILE
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

    if (!payload.name || !payload.phone || !payload.address) {
        return; // No alert
    }

    try {
        await apiRequest("/profile/update", "POST", payload);
    } catch (error) {
        console.error("Profile update failed:", error);
    }
}

saveBtn.addEventListener("click", saveProfile);

// -------------------------------
// FAQ TOGGLE
// -------------------------------
window.toggleFAQ = function () {
    const faq = document.getElementById("faqSection");
    faq.style.display = faq.style.display === "none" ? "block" : "none";

    // Hide info box when faq is opened
    infoBox.style.display = "none";
};

// Expand/Collapse question answers
document.addEventListener("click", (e) => {
    if (!e.target.classList.contains("faq-question")) return;

    const ans = e.target.nextElementSibling;
    ans.style.display = ans.style.display === "block" ? "none" : "block";
});

// -------------------------------
// INLINE ABOUT SECTION
// -------------------------------
window.showAbout = function () {
    infoBox.style.display = "block";
    infoBox.innerHTML = `
        <h4>About Sai Stores</h4>
        <p>Sai Stores provides quality products with faster delivery.</p>
        <p>All payments are handled securely using Razorpay.</p>
    `;

    // Hide FAQ when showing this
    document.getElementById("faqSection").style.display = "none";
};

// -------------------------------
// INLINE FEEDBACK SECTION
// -------------------------------
window.showFeedback = function () {
    infoBox.style.display = "block";
    infoBox.innerHTML = `
        <h4>Feedback</h4>
        <p>You can contact us anytime at:</p>
        <p><b>support@sai-stores.com</b></p>
    `;

    // Hide FAQ when showing this
    document.getElementById("faqSection").style.display = "none";
};

// -------------------------------
// OTHER SETTINGS
// -------------------------------
window.goToCart = () => (window.location.href = "cart.html");

window.logout = () => {
    localStorage.removeItem("user_token");
    window.location.href = "login.html";
};

// INIT
loadProfile();


const toggle = document.getElementById("themeToggle");
const root = document.documentElement;

const saved = localStorage.getItem("theme");
if (saved) root.setAttribute("data-theme", saved);

toggle.onclick = () => {
  const current = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", current);
  localStorage.setItem("theme", current);
};