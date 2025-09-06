// /scripts/tracker.js
import { saveMonthData, getMonthData, getAllMonths } from "../db/indexedDB.js";
import { toastExecution } from "../utils/toast.js";
import { updateExpenseTable, updateStatsUI, updateOverallUI, renderTable } from "./ui.js";


let editIndex = null;
let showIndex = 5;
let currentMonthKey = null;
let currentMonthData = null;

// Chart instances to allow destroy/redraw
let pieChartInstance = null;
let lineChartInstance = null;

export async function initializeMonth() {
  const date = new Date();
  const monthKey = date.toISOString().slice(0, 7);

  if (currentMonthKey === monthKey && currentMonthData) {
    return { monthKey: currentMonthKey, thisMonth: currentMonthData };
  }

  let thisMonth = await getMonthData(monthKey);
  if (!thisMonth) {
    thisMonth = { monthlyBudget: null, dailyExpenses: [] };
    await saveMonthData(monthKey, thisMonth);
  }

  currentMonthKey = monthKey;
  currentMonthData = thisMonth;
  return { monthKey, thisMonth };
}

// Create/Update entry
export async function dailyExpense() {
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

  currentMonthData = thisMonth;
  await saveMonthData(monthKey, thisMonth);

  clearInputs();
  calculate();
}

// Set monthly budget
export async function monthlyIncome() {
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
  currentMonthData = thisMonth;
  await saveMonthData(monthKey, thisMonth);

  document.getElementById("total").value = "";
  toastExecution("Monthly budget set successfully!");
  calculate();
}

// Recalculate + redraw UI
export async function calculate() {
  const { thisMonth } = await initializeMonth();

  const totalMonthlyExpense = thisMonth.dailyExpenses.reduce(
    (sum, entry) => sum + entry.total, 0
  );
  const remainingIncome =
    thisMonth.monthlyBudget !== null
      ? thisMonth.monthlyBudget - totalMonthlyExpense
      : 0;

  // Top cards
  updateStatsUI(thisMonth, totalMonthlyExpense, remainingIncome);

  // Overall (no avg daily, no % spent)
  const allMonths = await getAllMonths();
  let overallFunds = 0;
  let overallExpenses = 0;

  for (const monthData of allMonths) {
    if (monthData.monthlyBudget) overallFunds += monthData.monthlyBudget;
    overallExpenses += monthData.dailyExpenses.reduce(
      (sum, entry) => sum + entry.total, 0
    );
  }
  const overallRemaining = overallFunds - overallExpenses;

  updateOverallUI({ overallFunds, overallExpenses, overallRemaining });

  // Table + Charts
  updateExpenseTable(thisMonth); // stores lastThisMonth and renders top showIndex rows
  updateCharts(thisMonth);

  document.getElementById("monthlyIncomeBtn").disabled =
    thisMonth.monthlyBudget !== null;
}

// Delete
export async function deleteEntry(index) {
  if (confirm("Do you want to delete this entry?")) {
    const { monthKey, thisMonth } = await initializeMonth();
    thisMonth.dailyExpenses.splice(index, 1);
    currentMonthData = thisMonth;
    await saveMonthData(monthKey, thisMonth);
    toastExecution("Entry deleted successfully!");
    calculate();
  }
}

// Edit (prefill form)
export async function editEntry(index) {
  const { thisMonth } = await initializeMonth();
  const entry = thisMonth.dailyExpenses[index];

  document.getElementById("expenseDate").value = entry.date;
  document.getElementById("amount").value = entry.amount;
  document.getElementById("expenseType").value = entry.type;

  editIndex = index;
  document.getElementById("dailyBtn").textContent = "Update Entry";
}

// Pagination control
export function showMore() {
  showIndex += 5;
  calculate();
}
export function getShowIndex() {
  return showIndex;
}

// Charts
function updateCharts(thisMonth) {
  const pieCanvas = document.getElementById("pieChart");
  const lineCanvas = document.getElementById("lineChart");
  if (!pieCanvas || !lineCanvas || !window.Chart) return;

  // destroy previous instances
  if (pieChartInstance) pieChartInstance.destroy();
  if (lineChartInstance) lineChartInstance.destroy();

  // Pie: total by type
  const typeTotals = {};
  thisMonth.dailyExpenses.forEach((e) => {
    typeTotals[e.type] = (typeTotals[e.type] || 0) + e.total;
  });

  pieChartInstance = new Chart(pieCanvas, {
    type: "pie",
    data: {
      labels: Object.keys(typeTotals),
      datasets: [
        {
          data: Object.values(typeTotals),
        },
      ],
    },
    options: { responsive: true, plugins: { legend: { position: "bottom" } }, maintainAspectRatio: false },
  });

  // Line: daily trend (sorted by date)
  const trendMap = {};
  thisMonth.dailyExpenses.forEach((e) => {
    trendMap[e.date] = (trendMap[e.date] || 0) + e.total;
  });
  const sortedDates = Object.keys(trendMap).sort(); // ensure ascending x-axis

  lineChartInstance = new Chart(lineCanvas, {
    type: "line",
    data: {
      labels: sortedDates,
      datasets: [
        {
          label: "Expenses",
          data: sortedDates.map((d) => trendMap[d]),
          fill: false,
          tension: 0.2,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { title: { display: true, text: "Date" } },
        y: { title: { display: true, text: "Amount" } },
      },
      maintainAspectRatio: false,
    },
  });

  // Ensure canvas containers have a height in CSS (we set that in style.css)
}

// helpers
function clearInputs() {
  document.getElementById("expenseDate").value = "";
  document.getElementById("amount").value = "";
  document.getElementById("expenseType").value = "";
}

// --- Make sure Show More button works even if app didn't wire it
(function attachShowMore() {
  function attach() {
    const btn = document.getElementById("showMoreBtn");
    if (!btn) return;
    btn.addEventListener("click", () => {
      showIndex += 5;
      calculate();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attach);
  } else {
    attach();
  }
})();
