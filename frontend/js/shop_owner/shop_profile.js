import { apiRequest } from "../api.js";

let map;
let marker = null;
let selectedLocation = null;

// -------------------- INIT MAP --------------------
map = L.map("map").setView([20.5937, 78.9629], 5); // India default

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
}).addTo(map);

// -------------------- CURRENT LOCATION --------------------
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            setLocation(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
            console.warn("Location permission denied. Select manually.");
        }
    );
}

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
window.saveProfile = async function () {
    const msg = document.getElementById("profileMsg");

    const payload = {
        shop_name: shop_name.value.trim(),
        category: category.value.trim(),
        phone: phone.value.trim(),
        address: address.value.trim(),
        city: city.value.trim(),
        pincode: pincode.value.trim(),
        location: selectedLocation
    };

    if (!selectedLocation) {
        msg.textContent = "Please choose shop location on the map";
        return;
    }

    if (Object.values(payload).some(v => !v)) {
        msg.textContent = "All fields must be filled";
        return;
    }

    try {
        await apiRequest("/shop-owner/profile/", "POST", payload);
        msg.style.color = "green";
        msg.textContent = "Shop profile saved successfully";

        setTimeout(() => {
            window.location.href = "orders.html";
        }, 800);

    } catch (err) {
        msg.style.color = "red";
        msg.textContent = err.message || "Failed to save profile";
    }
};
