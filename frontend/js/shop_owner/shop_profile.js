import { apiRequest } from "../api.js";

let map;
let marker = null;
let selectedLocation = null;

// -------------------- INIT MAP --------------------
map = L.map("map").setView([20.5937, 78.9629], 5); // India default

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
}).addTo(map);

// -------------------- LOAD SAVED DATA --------------------
async function loadProfile() {
    try {
        const profile = await apiRequest("/shop-owner/profile/");
        if (!profile || !profile.shop_name) {
            // New profile - try geolocation
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => setLocation(pos.coords.latitude, pos.coords.longitude),
                    () => console.warn("Location denied")
                );
            }
            return;
        }

        // Fill Form
        document.getElementById("shop_name").value = profile.shop_name || "";
        document.getElementById("category").value = profile.category || "";
        document.getElementById("phone").value = profile.phone || "";
        document.getElementById("address").value = profile.address || "";
        document.getElementById("city").value = profile.city || "";
        document.getElementById("pincode").value = profile.pincode || "";

        // Fill Map
        if (profile.location && profile.location.lat) {
            setLocation(profile.location.lat, profile.location.lng);
        }

    } catch (err) {
        console.error("Failed to load profile", err);
    }
}

loadProfile();

// -------------------- MAP CLICK --------------------
map.on("click", (e) => {
    setLocation(e.latlng.lat, e.latlng.lng);
});

// -------------------- SET LOCATION --------------------
function setLocation(lat, lng) {
    selectedLocation = { lat, lng };

    map.setView([lat, lng], 16);

    if (marker) map.removeLayer(marker);

    marker = L.marker([lat, lng], { draggable: true }).addTo(map);

    marker.on("dragend", () => {
        const p = marker.getLatLng();
        reverseGeocode(p.lat, p.lng);
        selectedLocation = { lat: p.lat, lng: p.lng };
    });

    reverseGeocode(lat, lng);
}

// -------------------- REVERSE GEOCODE (AUTO-FILL) --------------------
async function reverseGeocode(lat, lng) {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        const data = await res.json();
        const addr = data.address || {};

        document.getElementById("address").value =
            data.display_name || "";

        document.getElementById("city").value =
            addr.city || addr.town || addr.village || "";

        document.getElementById("pincode").value =
            addr.postcode || "";

    } catch (err) {
        console.error("Reverse geocode failed", err);
    }
}

// -------------------- SAVE PROFILE --------------------
// -------------------- SAVE PROFILE --------------------
window.saveProfile = async function () {
    const msg = document.getElementById("profileMsg");
    msg.textContent = "Saving...";
    msg.style.color = "blue";

    try {
        const sName = document.getElementById("shop_name").value.trim();
        const sCat = document.getElementById("category").value.trim();
        const sPhone = document.getElementById("phone").value.trim();
        const sAddr = document.getElementById("address").value.trim();
        const sCity = document.getElementById("city").value.trim();
        const sZip = document.getElementById("pincode").value.trim();

        if (!sName || !sCat || !sPhone || !sAddr || !sCity || !sZip) {
            msg.textContent = "All fields are required (Name, Category, Phone, Address, City, Pincode)";
            msg.style.color = "red";
            return;
        }

        if (!selectedLocation) {
            msg.textContent = "Please set the location on the map";
            msg.style.color = "red";
            return;
        }

        const payload = {
            shop_name: sName,
            category: sCat,
            phone: sPhone,
            address: sAddr,
            city: sCity,
            pincode: sZip,
            location: selectedLocation
        };

        console.log("Saving profile payload:", payload);

        await apiRequest("/shop-owner/profile/", "POST", payload);

        msg.style.color = "green";
        msg.textContent = "Shop profile saved successfully! Redirecting...";

        setTimeout(() => {
            window.location.href = "orders.html";
        }, 1500);

    } catch (err) {
        console.error(err);
        msg.style.color = "red";
        msg.textContent = err.message || "Failed to save profile";
    }
};
