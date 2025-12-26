import { apiRequest } from "../api.js";

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const emailInput = document.getElementById("email");
const messageBox = document.getElementById("formMessage");
const passwordInput = document.getElementById("password");
const toggle = document.getElementById("togglePassword");

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
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            toggle.classList.replace("fa-eye", "fa-eye-slash");
        } else {
            passwordInput.type = "password";
            toggle.classList.replace("fa-eye-slash", "fa-eye");
        }
    });
}

/* ---------- MESSAGE ---------- */
function setMessage(text, type) {
    if (!messageBox) return;
    messageBox.textContent = text;
    messageBox.className = "form-message " + type;
}

/* ---------- REGISTER ---------- */
if (registerForm) {
    registerForm.addEventListener("submit", async e => {
        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        setMessage("Creating account…", "loading");

        try {
            await apiRequest("/auth/register", "POST", { name, email, password });
            setMessage("Account created. Redirecting…", "success");
            setTimeout(() => location.href = "login.html", 1200);
        } catch {
            setMessage("Registration failed", "error");
        }
    });
}

/* ---------- LOGIN ---------- */
if (loginForm) {
    loginForm.addEventListener("submit", async e => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        setMessage("Checking credentials…", "loading");

        try {
            const res = await apiRequest("/auth/login", "POST", { email, password });
            const token = res.token || res.access_token;

            localStorage.setItem("user_token", token);
            localStorage.setItem("user_email", email);

            setMessage("Logged in. Redirecting…", "success");
            setTimeout(() => location.href = "products.html", 1000);
        } catch {
            setMessage("Invalid email or password", "error");
        }
    });
}
