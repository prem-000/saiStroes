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
const nameDisplay = document.getElementById("p_name_display");
const emailEl = document.getElementById("p_email");
const personalSection = document.getElementById("personalSection");
const faqSection = document.getElementById("faqSection");

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

    console.log("Profile data loaded:", profile);

    nameEl.value = profile.name ?? "";
    nameDisplay.textContent = profile.name || "User Name";
    phoneEl.value = profile.phone ?? "";
    emailEl.value = profile.email ?? "No email found";
    addressEl.value = profile.address ?? "";
    pincodeEl.value = profile.pincode ?? "";
    cityEl.value = profile.city ?? "";
    stateEl.value = profile.state ?? "";

    // Gender
    if (profile.gender) {
      console.log("Setting gender to:", profile.gender);
      const genderRadio = document.querySelector(`input[name="gender"][value="${profile.gender.toLowerCase()}"]`);
      if (genderRadio) genderRadio.checked = true;
    }

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

async function saveProfile() {
  if (!selectedLat || !selectedLng) {
    alert("Please pin your delivery location on the map.");
    return;
  }

  const genderEl = document.querySelector('input[name="gender"]:checked');

  const payload = {
    name: nameEl.value.trim(),
    phone: phoneEl.value.trim(),
    address: addressEl.value.trim(),
    pincode: pincodeEl.value.trim(),
    city: cityEl.value.trim(),
    state: stateEl.value.trim(),
    gender: genderEl ? genderEl.value : null,
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
    nameDisplay.textContent = payload.name;
    alert("Profile updated successfully!");
  } catch (err) {
    console.error("Profile update failed:", err);
    alert("Failed to save profile.");
  } finally {
    saveBtn.classList.remove("loading");
  }
}

window.toggleEditMode = () => {
  nameEl.focus();
};

window.toggleFAQ = function () {
  const isHidden = faqSection.style.display === "none";
  faqSection.style.display = isHidden ? "block" : "none";
  personalSection.style.display = isHidden ? "none" : "block";

  // Update sidebar active state
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  if (isHidden) {
    const paymentNavItem = Array.from(document.querySelectorAll('.nav-item')).find(el => el.textContent.includes('Payment'));
    if (paymentNavItem) paymentNavItem.classList.add('active');
  } else {
    const accountNavItem = document.querySelector('[data-section="personal"]');
    if (accountNavItem) accountNavItem.classList.add('active');
  }
};

// FAQ Accordion Logic
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("faq-question")) {
    const item = e.target.parentElement;
    item.classList.toggle("active");
  }
});

/* ----------------------------------------------------
   UI ACTIONS
---------------------------------------------------- */
// Note: infoSection removed in new layout

window.goToCart = () => (window.location.href = "cart.html");

window.logout = () => {
  localStorage.removeItem("user_token");
  window.location.href = "login.html";
};

/* ----------------------------------------------------
   THEME TOGGLE
---------------------------------------------------- */
const themeToggleBtn = document.getElementById("themeToggle");
const root = document.documentElement;

const savedTheme = localStorage.getItem("theme");
if (savedTheme) root.setAttribute("data-theme", savedTheme);

function updateIcon() {
  if (!themeToggleBtn) return;
  themeToggleBtn.textContent =
    root.getAttribute("data-theme") === "dark" ? "☀️" : "🌙";
}

if (themeToggleBtn) {
  updateIcon();
  themeToggleBtn.onclick = () => {
    const next =
      root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    updateIcon();
  };
}

/* ----------------------------------------------------
   INIT
---------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  if (saveBtn) saveBtn.addEventListener("click", saveProfile);
  loadProfile();
});
