import { apiRequest } from "../api.js";

/* ----------------------------------------------------
   ELEMENTS
---------------------------------------------------- */
const nameEl = document.getElementById("p_name");
const phoneEl = document.getElementById("p_phone");
const addressEl = document.getElementById("p_address");
const pincodeEl = document.getElementById("p_pincode");
const cityEl = document.getElementById("p_city");
const stateEl = document.getElementById("p_state");
const saveBtn = document.getElementById("saveBtn");
const infoBox = document.getElementById("infoSection");

/* ----------------------------------------------------
   MAP STATE
---------------------------------------------------- */
let map = null;
let marker = null;
let selectedLat = null;
let selectedLng = null;

/* ----------------------------------------------------
   REVERSE GEOCODING (AUTO ADDRESS FILL)
---------------------------------------------------- */
async function fillAddressFromLatLng(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );

    const data = await res.json();
    if (!data || !data.address) return;

    addressEl.value = data.display_name || addressEl.value;

    cityEl.value =
      data.address.city ||
      data.address.town ||
      data.address.village ||
      "";

    stateEl.value = data.address.state || "";
    pincodeEl.value = data.address.postcode || "";
  } catch (err) {
    console.error("Reverse geocoding failed:", err);
  }
}

/* ----------------------------------------------------
   INIT LEAFLET MAP
---------------------------------------------------- */
function initMap(lat = 12.9716, lng = 77.5946) {
  if (map) map.remove();

  map = L.map("map").setView([lat, lng], 14);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  marker = L.marker([lat, lng], { draggable: true }).addTo(map);

  selectedLat = lat;
  selectedLng = lng;

  // drag pin
  marker.on("dragend", async () => {
    const pos = marker.getLatLng();
    selectedLat = pos.lat;
    selectedLng = pos.lng;
    await fillAddressFromLatLng(selectedLat, selectedLng);
  });

  // click map
  map.on("click", async (e) => {
    marker.setLatLng(e.latlng);
    selectedLat = e.latlng.lat;
    selectedLng = e.latlng.lng;
    await fillAddressFromLatLng(selectedLat, selectedLng);
  });
}

/* ----------------------------------------------------
   LOAD PROFILE
---------------------------------------------------- */
async function loadProfile() {
  try {
    const profile = await apiRequest("/profile/me");

    if (!profile || Object.keys(profile).length === 0) {
      initMap();
      return;
    }

    nameEl.value = profile.name ?? "";
    phoneEl.value = profile.phone ?? "";
    addressEl.value = profile.address ?? "";
    pincodeEl.value = profile.pincode ?? "";
    cityEl.value = profile.city ?? "";
    stateEl.value = profile.state ?? "";

    if (profile.lat && profile.lng) {
      initMap(profile.lat, profile.lng);
    } else {
      initMap();
    }
  } catch (err) {
    console.error("Failed to load profile:", err);
    initMap();
  }
}

/* ----------------------------------------------------
   SAVE PROFILE
---------------------------------------------------- */
async function saveProfile() {
  if (!selectedLat || !selectedLng) {
    alert("Please pin your delivery location on the map.");
    return;
  }

  const payload = {
    name: nameEl.value.trim(),
    phone: phoneEl.value.trim(),
    address: addressEl.value.trim(),
    pincode: pincodeEl.value.trim(),
    city: cityEl.value.trim(),
    state: stateEl.value.trim(),
    lat: selectedLat,
    lng: selectedLng,
  };

  if (!payload.name || !payload.phone || !payload.address) {
    alert("Name, phone, and address are required.");
    return;
  }

  saveBtn.classList.add("loading");

  try {
    await apiRequest("/profile/update", "POST", payload);
    saveBtn.classList.add("success");
    setTimeout(() => saveBtn.classList.remove("success"), 1200);
  } catch (err) {
    console.error("Profile update failed:", err);
    alert("Failed to save profile. Try again.");
  } finally {
    saveBtn.classList.remove("loading");
  }
}

/* ----------------------------------------------------
   UI ACTIONS
---------------------------------------------------- */
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

window.showAbout = function () {
  infoBox.style.display = "block";
  infoBox.innerHTML = `
    <h4>About Sai Stores</h4>
    <p>Sai Stores provides quality products with fast local delivery.</p>
    <p>Payments are securely processed using Razorpay.</p>
  `;
  document.getElementById("faqSection").style.display = "none";
};

window.showFeedback = function () {
  infoBox.style.display = "block";
  infoBox.innerHTML = `
    <h4>Feedback</h4>
    <p>Email us at <b>support@sai-stores.com</b></p>
  `;
  document.getElementById("faqSection").style.display = "none";
};

window.goToCart = () => (window.location.href = "cart.html");

window.logout = () => {
  localStorage.removeItem("user_token");
  window.location.href = "login.html";
};

/* ----------------------------------------------------
   THEME TOGGLE
---------------------------------------------------- */
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

/* ----------------------------------------------------
   INIT
---------------------------------------------------- */
saveBtn.addEventListener("click", saveProfile);
loadProfile();
