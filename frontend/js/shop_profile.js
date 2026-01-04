import { apiRequest } from "../api.js";

let map, marker, geocoder;
let latitude = null;
let longitude = null;

// -------------------- INIT MAP --------------------
window.initMap = function () {
    geocoder = new google.maps.Geocoder();

    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 20.5937, lng: 78.9629 }, // India
        zoom: 6
    });

    map.addListener("click", (e) => {
        latitude = e.latLng.lat();
        longitude = e.latLng.lng();

        if (marker) marker.setMap(null);
        marker = new google.maps.Marker({
            position: e.latLng,
            map
        });

        reverseGeocode(latitude, longitude);
    });
};

// -------------------- REVERSE GEOCODE --------------------
function reverseGeocode(lat, lng) {
    geocoder.geocode(
        { location: { lat, lng } },
        (results, status) => {
            if (status !== "OK" || !results[0]) {
                alert("Failed to fetch address");
                return;
            }

            const addr = results[0];

            document.getElementById("address").value =
                addr.formatted_address;

            let city = "", state = "", pincode = "";

            addr.address_components.forEach(c => {
                if (c.types.includes("locality")) city = c.long_name;
                if (c.types.includes("administrative_area_level_1")) state = c.long_name;
                if (c.types.includes("postal_code")) pincode = c.long_name;
            });

            document.getElementById("city").value = city;
            document.getElementById("state").value = state;
            document.getElementById("pincode").value = pincode;
        }
    );
}

// -------------------- SAVE PROFILE --------------------
window.saveProfile = async function () {
    const msg = document.getElementById("profileMsg");
    msg.textContent = "";

    if (!latitude || !longitude) {
        msg.textContent = "Select shop location on map.";
        msg.className = "form-msg error";
        return;
    }

    const payload = {
        shop_name: shop_name.value,
        category: category.value,
        phone: phone.value,

        address: address.value,
        city: city.value,
        state: state.value,
        pincode: pincode.value,

        latitude,
        longitude
    };

    try {
        await apiRequest("/shop-owner/profile/", "POST", payload);
        msg.textContent = "Shop location saved successfully.";
        msg.className = "form-msg success";
    } catch (err) {
        console.error(err);
        msg.textContent = "Failed to save shop profile.";
        msg.className = "form-msg error";
    }
};
