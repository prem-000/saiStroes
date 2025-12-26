import { apiRequest } from "../api.js";

// ----------------------------------------------
// AUTH CHECK
// ----------------------------------------------
const token = localStorage.getItem("shop_owner_token");
if (!token) {
    window.location.href = "/shop_owner/login.html";
}

// ----------------------------------------------
// DOM HELPERS
// ----------------------------------------------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ======================================================
// LOAD PRODUCTS
// ======================================================
async function loadProducts() {
    const root = $("#productsList");
    if (!root) return;

    try {
        const products = await apiRequest("/shop-owner/products/my");
        renderProducts(products);
    } catch (err) {
        console.error("Load products error:", err);
        root.innerHTML = `<p class="muted">Failed to load products</p>`;
    }
}

function renderProducts(products) {
    const root = $("#productsList");

    if (!Array.isArray(products) || products.length === 0) {
        root.innerHTML = `<p class="muted">No products found</p>`;
        return;
    }

    root.innerHTML = products.map(p => `
        <div class="product-card">
            <img src="${p.image || p.images?.[0] || '/img/default.jpg'}" class="product-img" />

            <div class="card-body">
                <h3>${p.title}</h3>
                <p>${p.description || ""}</p>

                <div class="meta">
                    <span>₹${p.price}</span>
                    <span>Stock: ${p.stock}</span>
                </div>

                <div class="meta">
                    <span>Category: ${p.category || "None"}</span>
                </div>

                <div class="actions">
                    <button class="btn-edit" data-id="${p.id}">Edit</button>
                    <button class="btn-delete" data-id="${p.id}">Delete</button>
                </div>
            </div>
        </div>
    `).join("");

    $$(".btn-edit").forEach(btn =>
        btn.addEventListener("click", () => goEdit(btn.dataset.id))
    );

    $$(".btn-delete").forEach(btn =>
        btn.addEventListener("click", () => deleteProduct(btn.dataset.id))
    );
}

// ======================================================
// GO TO EDIT PAGE
// ======================================================
function goEdit(id) {
    window.location.href = `/shop-owner/edit_product.html?id=${id}`;
}

// ======================================================
// DELETE PRODUCT
// ======================================================
async function deleteProduct(id) {
    if (!confirm("Delete this product?")) return;

    try {
        await apiRequest(`/shop-owner/products/${id}`, "DELETE");
        loadProducts();
    } catch (err) {
        alert(err.message);
    }
}

// ======================================================
// LOAD PRODUCT IN EDIT PAGE
// ======================================================
const editId = new URLSearchParams(window.location.search).get("id");

async function loadProductForEdit() {
    if (!editId) return;

    try {
        const products = await apiRequest("/shop-owner/products/my");
        const p = products.find(x => x.id === editId);

        if (!p) {
            alert("Product not found");
            return;
        }

        $("#title").value = p.title;
        $("#description").value = p.description || "";
        $("#price").value = p.price;
        $("#stock").value = p.stock;
        $("#category").value = p.category || "";
        $("#image").value = p.image || "";

    } catch (err) {
        alert("Failed to load product for edit");
    }
}

// ======================================================
// UPDATE PRODUCT
// ======================================================
const editForm = $("#editProductForm");

if (editForm) {
    editForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const payload = {
            title: $("#title").value,
            description: $("#description").value,
            price: Number($("#price").value),
            stock: Number($("#stock").value),
            category: $("#category").value.trim().toLowerCase(),
            image: $("#image").value
        };

        try {
            await apiRequest(`/shop-owner/products/${editId}`, "PUT", payload);
            window.location.href = "/shop_owner/my_products.html";
        } catch (err) {
            alert(err.message);
        }
    });
}

// ======================================================
// CREATE PRODUCT
// ======================================================
const createForm = $("#createProductForm");

if (createForm) {
    createForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const payload = {
            title: $("#title").value,
            description: $("#description").value,
            price: Number($("#price").value),
            stock: Number($("#stock").value),
            category: $("#category").value.trim().toLowerCase(),
            images: [$("#image").value]
        };

        try {
            await apiRequest("/shop-owner/products/create", "POST", payload);
            window.location.href = "/shop_owner/my_products.html";
        } catch (err) {
            alert(err.message);
        }
    });
}

// ======================================================
// INIT
// ======================================================
loadProducts();
loadProductForEdit();
