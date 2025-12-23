import { apiRequest } from "../api.js";

// ------------------------------
// USER REGISTER
// ------------------------------
const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        try {
            await apiRequest("/auth/register", "POST", {
                name,
                email,
                password,
            });

            alert("Registration successful!");
            window.location.href = "login.html";
        } catch (err) {
            alert("Registration failed: " + err.message);
        }
    });
}

// ------------------------------
// USER LOGIN
// ------------------------------
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        try {
            const res = await apiRequest("/auth/login", "POST", {
                email,
                password,
            });

            localStorage.setItem("user_token", res.token || res.access_token);

            alert("Login successful!");
            window.location.href = "products.html";
        } catch (err) {
            alert("Login failed: " + err.message);
        }
    });
}
