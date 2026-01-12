import { apiRequest } from "../api.js";

async function loadBank() {
    try {
        const data = await apiRequest("/shop-owner/bank/");
        if (data.bank_name) {
            document.getElementById("account_holder").value = data.account_holder_name || "";
            document.getElementById("account_number").value = data.account_number || "";
            document.getElementById("ifsc").value = data.ifsc_code || "";
            document.getElementById("bank_name").value = data.bank_name || "";
        }
    } catch (err) {
        console.error("Failed to load bank details", err);
    }
}

window.saveBank = async function () {
    const msg = document.getElementById("bankMsg");
    msg.textContent = "";

    const payload = {
        account_holder_name: document.getElementById("account_holder").value,
        account_number: document.getElementById("account_number").value,
        ifsc_code: document.getElementById("ifsc").value,
        bank_name: document.getElementById("bank_name").value
    };

    try {
        await apiRequest("/shop-owner/bank/update", "POST", payload);
        msg.textContent = "Bank details saved securely.";
        msg.className = "form-msg success";
    } catch {
        msg.textContent = "Failed to save bank details.";
        msg.className = "form-msg error";
    }
};

loadBank();
