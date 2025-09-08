// /app.js
import { openDB, getSetting, saveSetting } from "./db/indexedDB.js";
import { dailyExpense, monthlyIncome, calculate,editMonthlyIncome  } from "./tracker/tracker.js";
import { showLogin, showTracker, bindSearch } from "./tracker/ui.js";

// --- Constants
const PIN_KEY = "appPIN";

// --- DOM
const form = document.getElementById("loginForm");
const pinInput = document.getElementById("pin");
const formTitle = document.getElementById("formTitle");
const loginBtn = document.getElementById("loginBtn");
const editPinBtn = document.getElementById("editPinBtn");
const logoutBtn = document.getElementById("logoutBtn");
document.getElementById("editMonthlyIncomeBtn").addEventListener("click", editMonthlyIncome);

// --- App init
document.addEventListener("DOMContentLoaded", async () => {
  await openDB();
  await checkLoginStatus();

  // tracker events
  document.getElementById("dailyBtn").addEventListener("click", dailyExpense);
  document.getElementById("monthlyIncomeBtn").addEventListener("click", monthlyIncome);
  document.getElementById("showMoreBtn").addEventListener("click", () => {
    // imported showMore is not needed here; pressing button triggers it via tracker -> calculate refresh
    const evt = new Event("showMore-request");
    document.dispatchEvent(evt);
  });

  // make search live
  bindSearch();

  // clock
  updateClock();
  setInterval(updateClock, 1000);

  // bridge custom event (optional)
  document.addEventListener("showMore-request", () => {
    // fallback if you want to call tracker.showMore() instead, import it and call here
  });

  // PWA SW (optional)
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }
});

// --- Auth state
async function isLoggedIn() {
  return (await getSetting("isLoggedIn")) === true;
}

async function checkLoginStatus() {
  const savedPIN = await getSetting(PIN_KEY);
  if (await isLoggedIn()) {
    showTracker();
  } else {
    showLogin();
    initLogin(savedPIN);
  }
}

function updateClock() {
  const now = new Date();
  const clockEl = document.getElementById("clock");
  const dateEl = document.getElementById("date");
  if (clockEl) clockEl.innerText = now.toLocaleTimeString();
  if (dateEl) dateEl.innerText = now.toDateString();
}

// --- Login flow
function initLogin(savedPIN) {
  if (!savedPIN) {
    formTitle.innerText = "Set PIN";
    loginBtn.innerText = "Save PIN";
    editPinBtn.style.display = "none";
  } else {
    formTitle.innerText = "Enter PIN";
    loginBtn.innerText = "Login";
    editPinBtn.style.display = "inline-block";
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const enteredPIN = pinInput.value.trim();
  const savedPIN = await getSetting(PIN_KEY);

  // set PIN
  if (!savedPIN) {
    if (!enteredPIN) return;
    await saveSetting(PIN_KEY, enteredPIN);
    await saveSetting("isLoggedIn", true);
    showTracker();
    pinInput.value = "";
    return;
  }

  // login
  if (enteredPIN === savedPIN) {
    await saveSetting("isLoggedIn", true);
    showTracker();
  } else {
    alert("Wrong PIN!");
  }
  pinInput.value = "";
});

editPinBtn.addEventListener("click", async () => {
  const newPin = prompt("Enter new PIN");
  if (!newPin) return;
  await saveSetting(PIN_KEY, newPin);
  alert("PIN updated!");
});

logoutBtn.addEventListener("click", async () => {
  if (confirm("Are you sure you want to logout?")) {
    await saveSetting("isLoggedIn", false);
    showLogin();
    initLogin(await getSetting(PIN_KEY));
  }
});

// Set today's date label in tracker header
(function setTodayInHeader() {
  const date = new Date();
  const fullDate = date.toISOString().split("T")[0];
  const el = document.getElementById("dateOutput");
  if (el) el.textContent = fullDate;
})();

// After login, always refresh stats in case DB already has data
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) calculate();
});
