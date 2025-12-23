import { apiRequest } from "../api.js";

// ----------------------------------------------
// AUTH CHECK
// ----------------------------------------------
const token = localStorage.getItem("shop_owner_token");
if (!token) {
    alert("Login first");
    window.location.href = "login.html";
}

// ----------------------------------------------
// ELEMENTS
// ----------------------------------------------
const box = document.getElementById("notificationBox");
const emptyText = document.querySelector(".empty");
const markAllBtn = document.getElementById("markAllBtn");

// ----------------------------------------------
// LOAD NOTIFICATIONS
// ----------------------------------------------
async function loadNotifications() {
    try {
        const items = await apiRequest("/notifications/owner/me");
        renderList(items);
    } catch (err) {
        console.error("Load notif error:", err);
        alert("Failed to load notifications");
    }
}

// ----------------------------------------------
// RENDER LIST
// ----------------------------------------------
function renderList(items) {
    if (!Array.isArray(items) || items.length === 0) {
        emptyText.classList.remove("hidden");
        box.innerHTML = "";
        return;
    }

    emptyText.classList.add("hidden");

    box.innerHTML = items.map(createNotificationHTML).join("");

    document.querySelectorAll(".btn-read").forEach((btn) =>
        btn.addEventListener("click", markAsRead)
    );
}

// ----------------------------------------------
// TEMPLATE
// ----------------------------------------------
function createNotificationHTML(n) {
    const id = n.id; // backend sends id

    return `
        <div class="notification ${n.read ? "" : "unread"}" data-id="${id}">
            <div class="notification-title">${n.title}</div>
            <div class="notification-body">${n.body}</div>
            <div class="notification-time">${formatDate(n.created_at)}</div>

            ${
                n.read
                    ? ""
                    : `<button class="btn-read" data-id="${id}">Mark as read</button>`
            }
        </div>
    `;
}

// ----------------------------------------------
// FORMAT DATE
// ----------------------------------------------
function formatDate(dateStr) {
    if (!dateStr) return "Unknown";
    return new Date(dateStr).toLocaleString();
}

// ----------------------------------------------
// MARK ONE AS READ
// ----------------------------------------------
async function markAsRead(e) {
    const id = e.target.dataset.id;
    if (!id) return;

    try {
        await apiRequest(`/notifications/mark-read/${id}`, "PUT");
        loadNotifications();
    } catch (err) {
        console.error(err);
        alert("Failed to mark notification as read");
    }
}

// ----------------------------------------------
// MARK ALL AS READ
// ----------------------------------------------
if (markAllBtn) {
    markAllBtn.addEventListener("click", async () => {
        try {
            const items = await apiRequest("/notifications/owner/me");
            const unread = items.filter((n) => !n.read);

            for (const note of unread) {
                await apiRequest(`/notifications/mark-read/${note.id}`, "PUT");
            }

            alert("All notifications marked as read!");
            loadNotifications();
        } catch (err) {
            console.error(err);
            alert("Failed to mark all as read");
        }
    });
}

// ----------------------------------------------
// INIT
// ----------------------------------------------
loadNotifications();
