export const BASE_URL = "http://127.0.0.1:8000";

export async function apiRequest(url, method = "GET", data = null) {
    let token = null;

    if (window.location.pathname.includes("/user/")) {
        token = localStorage.getItem("user_token");
    } else if (window.location.pathname.includes("/shop_owner/")) {
        token = localStorage.getItem("shop_owner_token");
    } else {
        token = localStorage.getItem("user_token") || localStorage.getItem("token");
    }

    const options = {
        method,
        headers: { "Content-Type": "application/json" }
    };

    if (token) {
        options.headers["Authorization"] = `Bearer ${token}`;
    }
    if (data) {
        options.body = JSON.stringify(data);
    }

    const res = await fetch(BASE_URL + url, options);

    const json = await res.json().catch(() => ({ detail: "Invalid JSON" }));
    if (!res.ok) throw new Error(json.detail || "Request failed");

    return json;
}
