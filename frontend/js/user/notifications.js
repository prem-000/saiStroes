import { apiRequest } from "../api.js";

const list = document.getElementById("notificationList");
const dateFilter = document.getElementById("dateFilter");

/* ---------------------------
   DATE HELPERS
---------------------------- */
function isToday(d) {
    const now = new Date();
    return d.toDateString() === now.toDateString();
}

function isYesterday(d) {
    const now = new Date();
    const y = new Date(now);
    y.setDate(now.getDate() - 1);
    return d.toDateString() === y.toDateString();
}

function isLastWeek(d) {
    const now = new Date();
    const before7 = new Date(now);
    before7.setDate(now.getDate() - 7);
    return d > before7;
}

/* ---------------------------
   GROUPING FUNCTION
---------------------------- */
function groupNotifications(items) {
    const groups = {
        Today: [],
        Yesterday: [],
        "Last Week": [],
        Older: [],
    };

    items.forEach(n => {
        const d = new Date(n.timestamp);
        if (isToday(d)) groups.Today.push(n);
        else if (isYesterday(d)) groups.Yesterday.push(n);
        else if (isLastWeek(d)) groups["Last Week"].push(n);
        else groups.Older.push(n);
    });

    return groups;
}

/* ---------------------------
   RENDER UI
---------------------------- */
function renderGrouped(groups) {
    let html = "";

    Object.entries(groups).forEach(([groupName, items]) => {
        if (items.length === 0) return;

        html += `<h3 class="group-title">${groupName}</h3>`;

        items.forEach(n => {
            html += `
                <div class="notif-card ${n.read ? "read-card" : ""}">
                    <p class="notif-title">${n.message}</p>
                    <p class="notif-date">${new Date(n.timestamp).toLocaleString()}</p>

                    <div class="notif-actions">
                        ${
                            n.read
                                ? `<button class="btn-read" onclick="markUnread('${n._id}')">Mark Unread</button>`
                                : `<button class="btn-read" onclick="markRead('${n._id}')">Mark Read</button>`
                        }
                    </div>
                </div>
            `;
        });
    });

    list.innerHTML = html || "<p>No notifications</p>";
}

/* ---------------------------
   LOAD NOTIFICATIONS
---------------------------- */
async function loadNotifications(dateFilterValue = null) {
    try {
        let items = await apiRequest("/orders/notifications/me");

        // Sort → Unread first, then newest
        items.sort((a, b) => {
            if (a.read !== b.read) return a.read - b.read;
            return new Date(b.timestamp) - new Date(a.timestamp);
        });

        // Date filtering
        if (dateFilterValue) {
            const selected = new Date(dateFilterValue).toDateString();
            items = items.filter(n => new Date(n.timestamp).toDateString() === selected);
        }

        const groups = groupNotifications(items);
        renderGrouped(groups);
    } catch (err) {
        console.error(err);
        list.innerHTML = "<p>Failed to load notifications.</p>";
    }
}

loadNotifications();

/* ---------------------------
   DATE FILTER INPUT
---------------------------- */
dateFilter?.addEventListener("change", (e) => {
    loadNotifications(e.target.value);
});

/* ---------------------------
   MARK READ / UNREAD
---------------------------- */
window.markRead = async function (id) {
    await apiRequest(`/orders/notifications/mark-read/${id}`, "PUT");
    loadNotifications();
};

window.markUnread = async function (id) {
    await apiRequest(`/orders/notifications/mark-unread/${id}`, "PUT");
    loadNotifications();
};
