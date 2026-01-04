import { apiRequest } from "../api.js";

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const toggle = document.getElementById("togglePassword");
const messageBox = document.getElementById("formMessage");

/* ---------- SESSION ---------- */
const token = localStorage.getItem("user_token");
if (token && loginForm) {
    window.location.href = "products.html";
}

const savedEmail = localStorage.getItem("user_email");
if (savedEmail && emailInput) {
    emailInput.value = savedEmail;
}

/* ---------- PASSWORD TOGGLE ---------- */
if (toggle && passwordInput) {
    toggle.addEventListener("click", () => {
        const isPassword = passwordInput.type === "password";
        passwordInput.type = isPassword ? "text" : "password";
        toggle.className = isPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye";
    });
}

/* ---------- MESSAGE UTILS ---------- */
function setMessage(text, type = "") {
    if (!messageBox) return;
    messageBox.textContent = text;
    messageBox.className = "form-message " + type;
}

function setLoading(form, isLoading) {
    const btn = form.querySelector("button[type='submit']");
    if (!btn) return;

    btn.disabled = isLoading;
    btn.innerHTML = isLoading
        ? `<span class="spinner"></span> Please wait`
        : btn.dataset.label;
}

/* ---------- REGISTER ---------- */
if (registerForm) {
    const btn = registerForm.querySelector("button[type='submit']");
    btn.dataset.label = btn.innerHTML;

    registerForm.addEventListener("submit", async e => {
        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        setMessage("Creating account…", "loading");
        setLoading(registerForm, true);

        try {
            await apiRequest("/auth/register", "POST", { name, email, password });
            setMessage("Account created successfully. Redirecting…", "success");
            setTimeout(() => location.href = "login.html", 1200);
        } catch {
            setMessage("Registration failed. Try again.", "error");
            setLoading(registerForm, false);
        }
    });
}

/* ---------- LOGIN ---------- */
if (loginForm) {
    const btn = loginForm.querySelector("button[type='submit']");
    btn.dataset.label = btn.innerHTML;

    loginForm.addEventListener("submit", async e => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        setMessage("Checking credentials…", "loading");
        setLoading(loginForm, true);

        try {
            const res = await apiRequest("/auth/login", "POST", { email, password });
            const token = res.token || res.access_token;

            localStorage.setItem("user_token", token);
            localStorage.setItem("user_email", email);

            setMessage("Login successful. Redirecting…", "success");
            setTimeout(() => location.href = "products.html", 1000);
        } catch {
            setMessage("Invalid email or password.", "error");
            setLoading(loginForm, false);
        }
    });
}
