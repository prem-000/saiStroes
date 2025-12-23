// ----------------------------------------------
//  IMPORTS
// ----------------------------------------------
import { API_BASE } from "../api.js";

// ----------------------------------------------
//  AUTH CHECK
// ----------------------------------------------
const token = localStorage.getItem("shop_owner_token");
if (!token) {
    window.location.href = "login.html";
}

// ----------------------------------------------
//  OWNER-ONLY API REQUEST (FIXED)
// ----------------------------------------------
async function ownerRequest(url, method = "GET", data = null) {
    const token = localStorage.getItem("shop_owner_token");
    if (!token) throw new Error("No shop owner token found");

    const options = {
        method,
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token
        }
    };

    if (data) options.body = JSON.stringify(data);

    const res = await fetch(API_BASE + url, options);

    let json;
    try {
        json = await res.json();
    } catch {
        json = { detail: "Invalid JSON response" };
    }

    if (!res.ok) throw new Error(json.detail || "Request failed");

    return json;
}

// ----------------------------------------------
//  UTIL
// ----------------------------------------------
function set(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function escape(v) {
    if (v == null) return "";
    return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ----------------------------------------------
//  DASHBOARD SUMMARY
// ----------------------------------------------
async function loadDashboard() {
    try {
        const data = await ownerRequest("/shop-owner/dashboard/summary");

        set("totalOrders", data.total_orders);
        set("totalRevenue", "₹" + data.total_revenue);
        set("itemsSold", data.total_items_sold);
        set("weeklyRevenue", "₹" + data.weekly_revenue);
        set("monthlyRevenue", "₹" + data.monthly_revenue);
        // set("note" (
        //     "Hand cash amounts are shown strictly for analytical purposes only. ",
        //     "They are not credited to the shop owner's account balance."
        // ))

    } catch (err) {
        console.error("Dashboard error:", err);
        alert("Failed to load dashboard: " + err.message);
    }
}

// ----------------------------------------------
//  PRODUCTS TABLE
// ----------------------------------------------
let productsCache = [];
let currentSort = { key: null, dir: 1 };

async function loadProductsTable() {
    const root = document.getElementById("productsTableRoot");
    if (!root) return;

    try {
        const products = await ownerRequest("/shop-owner/products/my");
        productsCache = Array.isArray(products) ? products.slice() : [];

        console.log("Loaded products:", productsCache);
        renderTable(productsCache);

    } catch (err) {
        console.error("Products load FAILED:", err);
        root.innerHTML = `
            <p class="muted">Failed to load products.</p>
            <p style="color:red;font-size:13px;">Error: ${err.message}</p>
        `;
    }
}

function renderTable(list) {
    const root = document.getElementById("productsTableRoot");
    if (!root) return;

    root.innerHTML = `
        <div class="table-controls">
            <input id="tableSearch" placeholder="Search products..." />
            <button id="exportCsvBtn">Export CSV</button>
        </div>

        <table id="productsTable" class="excel-table">
            <thead>
                <tr>
                    <th data-key="_id">ID</th>
                    <th data-key="title">Title</th>
                    <th data-key="price">Price</th>
                    <th data-key="stock">Stock</th>
                    <th data-key="created_at">Created</th>
                    <th>Actions</th>
                </tr>
            </thead>

            <tbody>
                ${list.map((p) => rowTemplate(p)).join("")}
            </tbody>
        </table>
    `;

    document.getElementById("tableSearch").addEventListener("input", applySearch);
    document.getElementById("exportCsvBtn").addEventListener("click", exportCSV);

    document.querySelectorAll("th[data-key]").forEach((th) => {
        th.style.cursor = "pointer";
        th.addEventListener("click", () => sortTable(th.dataset.key));
    });

    attachRowEvents();
}

function rowTemplate(p) {
    return `
        <tr data-id="${escape(p._id)}">
            <td>${escape(p._id)}</td>
            <td>${escape(p.title)}</td>
            <td>${escape(p.price)}</td>
            <td>${escape(p.stock)}</td>
            <td>${escape(p.created_at || "")}</td>
            <td>
                <button class="btn-edit" data-id="${escape(p._id)}">Edit</button>
                <button class="btn-delete" data-id="${escape(p._id)}">Delete</button>
            </td>
        </tr>
    `;
}

function applySearch() {
    const search = document.getElementById("tableSearch").value.toLowerCase();

    const filtered = productsCache.filter((p) => {
        const s = `${p._id} ${p.title} ${p.description}`.toLowerCase();
        return s.includes(search);
    });

    updateRows(filtered);
}

function sortTable(key) {
    if (currentSort.key === key) currentSort.dir *= -1;
    else {
        currentSort.key = key;
        currentSort.dir = 1;
    }

    const sorted = [...productsCache].sort((a, b) => {
        let av = a[key] ?? "";
        let bv = b[key] ?? "";

        const an = Number(av);
        const bn = Number(bv);

        if (!isNaN(an) && !isNaN(bn)) return (an - bn) * currentSort.dir;

        av = String(av).toLowerCase();
        bv = String(bv).toLowerCase();

        return av < bv ? -1 * currentSort.dir : av > bv ? 1 * currentSort.dir : 0;
    });

    updateRows(sorted);
}

function updateRows(list) {
    const tbody = document.querySelector("#productsTable tbody");
    tbody.innerHTML = list.map((p) => rowTemplate(p)).join("");
    attachRowEvents();
}

function attachRowEvents() {
    document.querySelectorAll(".btn-edit").forEach((btn) =>
        btn.addEventListener("click", () => {
            window.location.href = `edit_product.html?id=${btn.dataset.id}`;
        })
    );

    document.querySelectorAll(".btn-delete").forEach((btn) =>
        btn.addEventListener("click", async () => {
            if (!confirm("Delete product?")) return;

            try {
                await ownerRequest(`/shop-owner/products/${btn.dataset.id}`, "DELETE");
                productsCache = productsCache.filter((p) => p._id !== btn.dataset.id);
                updateRows(productsCache);
            } catch (err) {
                alert("Delete failed: " + err.message);
            }
        })
    );
}

// ----------------------------------------------
//  EXPORT CSV
// ----------------------------------------------
function exportCSV() {
    const rows = Array.from(document.querySelectorAll("#productsTable tbody tr"));
    if (!rows.length) return alert("No products to export");

    const csv = [["ID", "Title", "Price", "Stock", "Created"]];

    rows.forEach((row) => {
        const cells = row.querySelectorAll("td");
        csv.push([
            cells[0].textContent,
            cells[1].textContent,
            cells[2].textContent,
            cells[3].textContent,
            cells[4].textContent,
        ]);
    });

    const csvStr = csv.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csvStr], { type: "text/csv" });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `products_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
}

// ----------------------------------------------
//  NOTIFICATIONS
// ----------------------------------------------
async function loadUnreadCount() {
    try {
        const data = await ownerRequest("/notifications/owner/me");
        const unread = data.filter((n) => !n.read).length;
        set("notifCount", unread);
    } catch (err) {
        console.error("Notif load failed:", err);
    }
}

// ----------------------------------------------
//  LOGOUT
// ----------------------------------------------
function logout() {
    localStorage.removeItem("shop_owner_token");
    window.location.href = "login.html";
}
window.logout = logout;

// ----------------------------------------------
//  INIT
// ----------------------------------------------
loadDashboard();
loadProductsTable();
loadUnreadCount();
setInterval(loadUnreadCount, 15000);
