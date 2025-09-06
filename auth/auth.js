import { getSetting, saveSetting } from "../db/indexedDB.js";
import { showTracker, showLogin } from "../tracker/ui.js";

const PIN_KEY = "appPIN";
let currentMode = "login";

export async function initLoginUI() {
  const savedPIN = await getSetting(PIN_KEY);
  const formTitle = document.getElementById("formTitle");
  const loginBtn = document.getElementById("loginBtn");
  const editPinBtn = document.getElementById("editPinBtn");

  if (!savedPIN) {
    currentMode = "set";
    formTitle.innerText = "Set PIN";
    loginBtn.innerText = "Save PIN";
    editPinBtn.style.display = "none";
  } else {
    currentMode = "login";
    formTitle.innerText = "Enter PIN";
    loginBtn.innerText = "Login";
    editPinBtn.style.display = "inline-block";
  }
}

export function enableAuthListeners() {
  const form = document.getElementById("loginForm");
  const pinInput = document.getElementById("pin");
  const loginBtn = document.getElementById("loginBtn");
  const editPinBtn = document.getElementById("editPinBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const enteredPIN = pinInput.value.trim();
    const savedPIN = await getSetting(PIN_KEY);

    if (currentMode === "set") {
      await saveSetting(PIN_KEY, enteredPIN);
      alert("PIN set successfully!");
      initLoginUI();
    } else if (currentMode === "login") {
      if (enteredPIN === savedPIN) {
        await saveSetting("isLoggedIn", true);
        showTracker();
      } else {
        alert("Wrong PIN!");
      }
    } else if (currentMode === "edit") {
      await saveSetting(PIN_KEY, enteredPIN);
      alert("PIN updated!");
      initLoginUI();
    }
    pinInput.value = "";
  });

  editPinBtn.addEventListener("click", () => {
    currentMode = "edit";
    document.getElementById("formTitle").innerText = "Edit PIN";
    loginBtn.innerText = "Save New PIN";
    pinInput.value = "";
  });

  logoutBtn.addEventListener("click", async () => {
    if (confirm("Are you sure you want to logout?")) {
      await saveSetting("isLoggedIn", false);
      showLogin();
      initLoginUI();
    }
  });
}
