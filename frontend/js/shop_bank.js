import { apiRequest } from "../api.js";

window.saveBank = async function () {
    const msg = document.getElementById("bankMsg");
    msg.textContent = "";

    const payload = {
        account_holder: account_holder.value,
        account_number: account_number.value,
        ifsc: ifsc.value,
        bank_name: bank_name.value,
        upi_id: upi_id.value || null
    };

    try {
        await apiRequest("/shop-owner/bank/", "POST", payload);
        msg.textContent = "Bank details saved successfully.";
        msg.className = "form-msg success";
    } catch {
        msg.textContent = "Failed to save bank details.";
        msg.className = "form-msg error";
    }
};
