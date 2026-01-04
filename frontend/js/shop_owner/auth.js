// SHOP OWNER REGISTRATION


const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        try {
            const res = await apiRequest(
                "/shop-owner/register",
                "POST",
                { name, email, password }
            );

            alert("Registered successfully!");
            window.location.href = "login.html";

        } catch (err) {
            alert("Registration failed: " + err.message);
        }
    });
}



import { apiRequest } from "../api.js";

// SHOP OWNER LOGIN
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        try {
            const res = await apiRequest("/shop-owner/login", "POST", {
                email,
                password,
            });

            localStorage.setItem("shop_owner_token", res.access_token);

            window.location.href = "dashboard.html";
        } catch (err) {
            alert("Login failed: " + err.message);
        }
    });
}


const passwordInput = document.getElementById("password");
const toggle = document.getElementById("togglePassword");

if (toggle && passwordInput) {
    toggle.addEventListener("click", () => {
        const isHidden = passwordInput.type === "password";

        passwordInput.type = isHidden ? "text" : "password";

        toggle.classList.toggle("fa-eye", !isHidden);
        toggle.classList.toggle("fa-eye-slash", isHidden);
    });
}
