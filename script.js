// -------------------- Constants --------------------
const PIN_KEY = "appPIN";
let currentMode = "login"; // login | set | edit
let editIndex = null;
let showIndex = 5;
let db; // IndexedDB reference

// -------------------- IndexedDB Wrapper --------------------
const DB_NAME = "expense-tracker-db";
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      db = e.target.result;
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("expenses")) {
        db.createObjectStore("expenses", { keyPath: "monthKey" });
      }
    };

    request.onsuccess = (e) => {
      db = e.target.result;
      resolve(db);
    };

    request.onerror = (e) => reject(e.target.error);
  });
}

function saveSetting(key, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("settings", "readwrite");
    tx.objectStore("settings").put({ key, value });
    tx.oncomplete = () => resolve(true);
    tx.onerror = (e) => reject(e.target.error);
  });
}

function getSetting(key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("settings", "readonly");
    const req = tx.objectStore("settings").get(key);
    req.onsuccess = () => resolve(req.result ? req.result.value : null);
    req.onerror = (e) => reject(e.target.error);
  });
}

function saveMonthData(monthKey, data) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("expenses", "readwrite");
    tx.objectStore("expenses").put({ monthKey, ...data });
    tx.oncomplete = () => resolve(true);
    tx.onerror = (e) => reject(e.target.error);
  });
}

function getMonthData(monthKey) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("expenses", "readonly");
    const req = tx.objectStore("expenses").get(monthKey);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = (e) => reject(e.target.error);
  });
}

function getAllMonths() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("expenses", "readonly");
    const req = tx.objectStore("expenses").getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = (e) => reject(e.target.error);
  });
}

// -------------------- DOM Elements --------------------
const loginScreen = document.getElementById("loginScreen");
const trackerScreen = document.getElementById("trackerScreen");
const form = document.getElementById("loginForm");
const pinInput = document.getElementById("pin");
const formTitle = document.getElementById("formTitle");
const loginBtn = document.getElementById("loginBtn");
const editPinBtn = document.getElementById("editPinBtn");
const logoutBtn = document.getElementById("logoutBtn");

// -------------------- App Init --------------------
document.addEventListener("DOMContentLoaded", async function () {
  await openDB();
  checkLoginStatus();
});

// -------------------- Auth --------------------
async function isLoggedIn() {
  return (await getSetting("isLoggedIn")) === true;
}

async function checkLoginStatus() {
  if (await isLoggedIn()) {
    showTracker();
  } else {
    showLogin();
    initLogin();
  }
}

function showLogin() {
  loginScreen.style.display = "flex";
  trackerScreen.style.display = "none";
  updateClock();
  setInterval(updateClock, 1000);
}

function showTracker() {
  loginScreen.style.display = "none";
  trackerScreen.style.display = "block";
  initTracker();
}

function updateClock() {
  const now = new Date();
  const clockEl = document.getElementById("clock");
  const dateEl = document.getElementById("date");
  if (clockEl) clockEl.innerText = now.toLocaleTimeString();
  if (dateEl) dateEl.innerText = now.toDateString();
}

async function initLogin() {
  const savedPIN = await getSetting(PIN_KEY);
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

form.addEventListener("submit", async function (e) {
  e.preventDefault();
  const enteredPIN = pinInput.value.trim();
  const savedPIN = await getSetting(PIN_KEY);

  if (currentMode === "set") {
    await saveSetting(PIN_KEY, enteredPIN);
    alert("PIN set successfully!");
    initLogin();
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
    initLogin();
  }
  pinInput.value = "";
});

editPinBtn.addEventListener("click", function () {
  currentMode = "edit";
  formTitle.innerText = "Edit PIN";
  loginBtn.innerText = "Save New PIN";
  pinInput.value = "";
});

logoutBtn.addEventListener("click", async function () {
  if (confirm("Are you sure you want to logout?")) {
    await saveSetting("isLoggedIn", false);
    showLogin();
    initLogin();
  }
});

// -------------------- Tracker --------------------
async function initTracker() {
  const date = new Date();
  const fullDate = date.toISOString().split("T")[0];
  document.getElementById("dateOutput").textContent = fullDate;

  setupTrackerEventListeners();
  calculate();
}

function setupTrackerEventListeners() {
  const dailyBtn = document.getElementById("dailyBtn");
  const monthlyIncomeBtn = document.getElementById("monthlyIncomeBtn");
  const showMoreBtn = document.getElementById("showMoreBtn");

  dailyBtn.addEventListener("click", dailyExpense);
  monthlyIncomeBtn.addEventListener("click", monthlyIncome);
  showMoreBtn.addEventListener("click", showMore);
}

async function initializeMonth() {
  const date = new Date();
  const fullDate = date.toISOString().split("T")[0];
  const monthKey = fullDate.slice(0, 7);

  let thisMonth = await getMonthData(monthKey);
  if (!thisMonth) {
    thisMonth = { monthlyBudget: null, dailyExpenses: [] };
    await saveMonthData(monthKey, thisMonth);
  }
  return { monthKey, thisMonth };
}

async function dailyExpense() {
  const setDate = document.getElementById("expenseDate").value;
  const amount = Number(document.getElementById("amount").value) || 0;
  const expenseType = document.getElementById("expenseType").value;

  if (!setDate || amount === 0 || expenseType === "") {
    return toastExecution("Please add valid entry!");
  }

  const { monthKey, thisMonth } = await initializeMonth();
  const newEntry = { date: setDate, amount, type: expenseType, total: amount };

  if (editIndex !== null) {
    thisMonth.dailyExpenses[editIndex] = newEntry;
    editIndex = null;
    document.getElementById("dailyBtn").textContent = "Submit Daily Expense";
    toastExecution("Entry Updated Successfully!");
  } else {
    thisMonth.dailyExpenses.push(newEntry);
    toastExecution("Entry Added Successfully!");
  }

  await saveMonthData(monthKey, thisMonth);

  document.getElementById("expenseDate").value = "";
  document.getElementById("amount").value = "";
  document.getElementById("expenseType").value = "";

  calculate();
}

async function monthlyIncome() {
  const totalIncome = Number(document.getElementById("total").value);
  if (!totalIncome || totalIncome <= 0) {
    toastExecution("Please enter a valid monthly budget!");
    return;
  }

  const { monthKey, thisMonth } = await initializeMonth();
  if (thisMonth.monthlyBudget !== null) {
    toastExecution("Budget already set for this month!");
    return;
  }

  thisMonth.monthlyBudget = totalIncome;
  await saveMonthData(monthKey, thisMonth);

  document.getElementById("total").value = "";
  toastExecution("Monthly budget set successfully!");
  calculate();
}

async function calculate() {
  const { thisMonth } = await initializeMonth();

  const totalMonthlyExpense = thisMonth.dailyExpenses.reduce(
    (sum, entry) => sum + entry.total,
    0
  );
  const remainingIncome =
    thisMonth.monthlyBudget !== null
      ? thisMonth.monthlyBudget - totalMonthlyExpense
      : 0;

  document.getElementById("monthlyExpenseOutput").textContent =
    totalMonthlyExpense;
  document.getElementById("totalBudgetOutput").textContent =
    thisMonth.monthlyBudget || 0;
  document.getElementById("remainingBudgetOutput").textContent =
    remainingIncome;

  // Overall stats
  const allMonths = await getAllMonths();
  let overallFunds = 0,
    overallExpenses = 0,
    totalDays = 0;

  allMonths.forEach((monthData) => {
    if (monthData.monthlyBudget) overallFunds += monthData.monthlyBudget;
    const monthExpense = monthData.dailyExpenses.reduce(
      (sum, entry) => sum + entry.total,
      0
    );
    overallExpenses += monthExpense;
    totalDays += monthData.dailyExpenses.length;
  });

  const overallRemaining = overallFunds - overallExpenses;
  const avgDaily =
    totalDays > 0 ? (overallExpenses / totalDays).toFixed(2) : 0;
  const percentSpent =
    overallFunds > 0
      ? ((overallExpenses / overallFunds) * 100).toFixed(1)
      : 0;

  document.getElementById("overallTotalFunds").textContent = overallFunds;
  document.getElementById("overallTotalExpenses").textContent = overallExpenses;
  document.getElementById("overallTotalRemaining").textContent =
    overallRemaining;
  document.getElementById("overallAvgDaily").textContent = avgDaily;
  document.getElementById("overallPercentage").textContent =
    percentSpent + "%";

  updateExpenseTable(thisMonth);
  document.getElementById("monthlyIncomeBtn").disabled =
    thisMonth.monthlyBudget !== null;
}

function updateExpenseTable(thisMonth) {
  const reportBody = document.getElementById("reportBody");
  reportBody.innerHTML = "";

  thisMonth.dailyExpenses
    .slice()
    .reverse()
    .forEach((entry, reverseIndex) => {
      const index = thisMonth.dailyExpenses.length - 1 - reverseIndex;
      if (reverseIndex < showIndex) {
        const row = document.createElement("tr");
        [entry.date, entry.amount, entry.type].forEach((val) => {
          const td = document.createElement("td");
          td.textContent = val;
          row.appendChild(td);
        });

        const td = document.createElement("td");
        td.className = "action-buttons";

        const editBtn = document.createElement("button");
        editBtn.className = "edit-btn";
        editBtn.onclick = () => editEntry(index);
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.onclick = () => deleteEntry(index);
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';

        td.appendChild(editBtn);
        td.appendChild(deleteBtn);
        row.appendChild(td);
        reportBody.appendChild(row);
      }
    });

  const showMoreBtn = document.getElementById("showMoreBtn");
  showMoreBtn.style.display =
    thisMonth.dailyExpenses.length <= showIndex ? "none" : "block";
}

async function deleteEntry(index) {
  if (confirm("Do you want to delete this entry?")) {
    const { monthKey, thisMonth } = await initializeMonth();
    thisMonth.dailyExpenses.splice(index, 1);
    await saveMonthData(monthKey, thisMonth);
    toastExecution("Entry deleted successfully!");
    calculate();
  }
}

async function editEntry(index) {
  const { thisMonth } = await initializeMonth();
  const entry = thisMonth.dailyExpenses[index];

  document.getElementById("expenseDate").value = entry.date;
  document.getElementById("amount").value = entry.amount;
  document.getElementById("expenseType").value = entry.type;

  editIndex = index;
  document.getElementById("dailyBtn").textContent = "Update Entry";
}

function showMore() {
  showIndex += 5;
  calculate();
}

// -------------------- Toast --------------------
let toast = document.getElementById("toast");
let toastHeading = document.getElementById("toast-content");

function toastExecution(content) {
  toastHeading.textContent = content;
  toast.classList.remove("disable");
  toast.classList.add("active");
  setTimeout(() => {
    toast.classList.remove("active");
    toast.classList.add("disable");
  }, 3000);
}

function closeToast() {
  toast.classList.remove("active");
  toast.classList.add("disable");
}

// -------------------- PWA --------------------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("service-worker.js")
      .then(() => console.log("✅ Service Worker registered"))
      .catch((err) => console.log("❌ SW registration failed:", err));
  });
}
