export const BASE_URL = "https://saistroes-b7xu.onrender.com";


// Generic API request helper (AUTO-TOKEN)
export async function apiRequest(url, method = "GET", data = null) {
    let token = null;

// USER pages should only use user_token
    if (window.location.pathname.includes("/user/")) {
        token = localStorage.getItem("user_token");
    } 
    // SHOP OWNER pages should only use shop_owner_token
    else if (window.location.pathname.includes("/shop_owner/")) {
        token = localStorage.getItem("shop_owner_token");
    } 
    else {
        token = localStorage.getItem("user_token") || localStorage.getItem("token");
    }


        
    const options = {
        method,
        headers: {
            "Content-Type": "application/json",
        }
    };

    if (token) {
        options.headers["Authorization"] = `Bearer ${token}`;
    }

    if (data) {
        options.body = JSON.stringify(data);
    }

    const res = await fetch(API_BASE + url, options);

    const json = await res.json().catch(() => ({
        detail: "Invalid JSON response"
    }));

    if (!res.ok) {
        throw new Error(json.detail || "Request failed");
    }

    return json;
}
