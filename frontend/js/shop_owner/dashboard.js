import { apiRequest } from "../api.js";

// ----------------------------------------------
// AUTH CHECK
// ----------------------------------------------
const token = localStorage.getItem("shop_owner_token");
if (!token) {
    window.location.href = "login.html";
}

// ----------------------------------------------
// UTIL
// ----------------------------------------------
function set(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val ?? "";
}

function escape(v) {
    if (v == null) return "";
    return String(v)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

// ----------------------------------------------
// DASHBOARD SUMMARY
// ----------------------------------------------
async function loadDashboard() {
    try {
        const data = await apiRequest("/shop-owner/dashboard/summary");

        set("totalOrders", data.total_orders);
        set("totalRevenue", "₹" + data.total_revenue);
        set("itemsSold", data.total_items_sold);
        set("weeklyRevenue", "₹" + data.weekly_revenue);
        set("monthlyRevenue", "₹" + data.monthly_revenue);

    } catch (err) {
        console.error("Dashboard error:", err);
        alert("Failed to load dashboard");
    }
}

// ----------------------------------------------
// PRODUCTS TABLE
// ----------------------------------------------
let productsCache = [];
let currentSort = { key: null, dir: 1 };

async function loadProductsTable() {
    const root = document.getElementById("productsTableRoot");
    if (!root) return;

    try {
        const products = await apiRequest("/shop-owner/products/my");
        productsCache = Array.isArray(products) ? products.slice() : [];
        renderTable(productsCache);

    } catch (err) {
        console.error("Products hooking failed:", err);
        root.innerHTML = `<p class="muted">Failed to load products</p>`;
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
                ${list.map(rowTemplate).join("")}
            </tbody>
        </table>
    `;

    document.getElementById("tableSearch").addEventListener("input", applySearch);
    document.getElementById("exportCsvBtn").addEventListener("click", exportCSV);

    document.querySelectorAll("th[data-key]").forEach(th => {
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
    const q = document.getElementById("tableSearch").value.toLowerCase();
    updateRows(productsCache.filter(p =>
        `${p._id} ${p.title} ${p.description || ""}`.toLowerCase().includes(q)
    ));
}

function sortTable(key) {
    currentSort.dir = currentSort.key === key ? -currentSort.dir : 1;
    currentSort.key = key;

    const sorted = [...productsCache].sort((a, b) => {
        const av = a[key] ?? "";
        const bv = b[key] ?? "";
        if (!isNaN(av) && !isNaN(bv)) return (av - bv) * currentSort.dir;
        return String(av).localeCompare(String(bv)) * currentSort.dir;
    });

    updateRows(sorted);
}

function updateRows(list) {
    const tbody = document.querySelector("#productsTable tbody");
    tbody.innerHTML = list.map(rowTemplate).join("");
    attachRowEvents();
}

function attachRowEvents() {
    document.querySelectorAll(".btn-edit").forEach(btn =>
        btn.onclick = () =>
            window.location.href = `edit_product.html?id=${btn.dataset.id}`
    );

    document.querySelectorAll(".btn-delete").forEach(btn =>
        btn.onclick = async () => {
            if (!confirm("Delete product?")) return;
            await apiRequest(`/shop-owner/products/${btn.dataset.id}`, "DELETE");
            productsCache = productsCache.filter(p => p._id !== btn.dataset.id);
            updateRows(productsCache);
        }
    );
}

// ----------------------------------------------
// EXPORT CSV
// ----------------------------------------------
function exportCSV() {
    const rows = document.querySelectorAll("#productsTable tbody tr");
    if (!rows.length) return alert("No products");

    const csv = [["ID", "Title", "Price", "Stock", "Created"]];
    rows.forEach(r => {
        csv.push([...r.children].slice(0, 5).map(td => td.textContent));
    });

    const blob = new Blob(
        [csv.map(r => r.map(c => `"${c}"`).join(",")).join("\n")],
        { type: "text/csv" }
    );

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "products.csv";
    a.click();
}

// ----------------------------------------------
// NOTIFICATIONS
// ----------------------------------------------
async function loadUnreadCount() {
    try {
        const notes = await apiRequest("/notifications/owner/me");
        set("notifCount", notes.filter(n => !n.read).length);
    } catch {}
}

// ----------------------------------------------
// LOGOUT
// ----------------------------------------------
window.logout = () => {
    localStorage.removeItem("shop_owner_token");
    window.location.href = "login.html";
};

// ----------------------------------------------
// INIT
// ----------------------------------------------
loadDashboard();
loadProductsTable();
loadUnreadCount();
setInterval(loadUnreadCount, 15000);
