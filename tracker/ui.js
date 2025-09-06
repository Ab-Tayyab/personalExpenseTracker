// /scripts/ui.js
import { calculate, editEntry, deleteEntry, getShowIndex } from "./tracker.js";

const els = {
  loginScreen: document.getElementById("loginScreen"),
  trackerScreen: document.getElementById("trackerScreen"),
  reportBody: document.getElementById("reportBody"),
  showMoreBtn: document.getElementById("showMoreBtn"),
  monthlyExpenseOutput: document.getElementById("monthlyExpenseOutput"),
  totalBudgetOutput: document.getElementById("totalBudgetOutput"),
  remainingBudgetOutput: document.getElementById("remainingBudgetOutput"),
  overallTotalFunds: document.getElementById("overallTotalFunds"),
  overallTotalExpenses: document.getElementById("overallTotalExpenses"),
  overallTotalRemaining: document.getElementById("overallTotalRemaining"),
  searchInput: document.getElementById("searchInput"),
};

let lastThisMonth = null;
let delegateAttached = false;

export function showLogin() {
  els.loginScreen.style.display = "flex";
  els.trackerScreen.style.display = "none";
}

export function showTracker() {
  els.loginScreen.style.display = "none";
  els.trackerScreen.style.display = "block";
  calculate();
}

// Stats update
export function updateStatsUI(thisMonth, totalMonthlyExpense, remainingIncome) {
  els.monthlyExpenseOutput.textContent = totalMonthlyExpense;
  els.totalBudgetOutput.textContent = thisMonth.monthlyBudget || 0;
  els.remainingBudgetOutput.textContent = remainingIncome;
}

// Overall update
export function updateOverallUI({ overallFunds, overallExpenses, overallRemaining }) {
  els.overallTotalFunds.textContent = overallFunds;
  els.overallTotalExpenses.textContent = overallExpenses;
  els.overallTotalRemaining.textContent = overallRemaining;
}

// Render table (full dataset, searchable)
export function updateExpenseTable(thisMonth) {
  lastThisMonth = thisMonth;
  renderTable(""); // no filter -> show top showIndex rows
}

// internal render function: if filterTerm provided, show all matching entries (no pagination)
export function renderTable(filterTerm = "") {
  if (!lastThisMonth) return;
  const all = lastThisMonth.dailyExpenses
    .map((e, idx) => ({ ...e, __idx: idx })) // preserve original index
    .slice()
    .reverse(); // newest first

  const term = (filterTerm || "").trim().toLowerCase();

  let filtered = all;
  if (term !== "") {
    filtered = all.filter((item) => {
      return (
        String(item.date).toLowerCase().includes(term) ||
        String(item.amount).toLowerCase().includes(term) ||
        String(item.type).toLowerCase().includes(term)
      );
    });
  }

  // Decide visible set: if searching -> show all matched; otherwise show up to showIndex
  const showIndex = getShowIndex();
  let visible = [];
  if (term !== "") {
    visible = filtered;
  } else {
    visible = filtered.slice(0, showIndex);
  }

  // Build HTML
  els.reportBody.innerHTML = "";
  visible.forEach((item) => {
    const idx = item.__idx;
    els.reportBody.insertAdjacentHTML(
      "beforeend",
      `
      <tr data-index="${idx}">
        <td>${item.date}</td>
        <td>${item.amount}</td>
        <td>${item.type}</td>
        <td class="action-buttons">
          <button class="edit-btn" title="Edit"><i class="fas fa-edit"></i></button>
          <button class="delete-btn" title="Delete"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `
    );
  });

  // Show More button visibility: only when not searching and entries exceed showIndex
  if (term === "" && all.length > showIndex) {
    els.showMoreBtn.style.display = "block";
  } else {
    els.showMoreBtn.style.display = "none";
  }

  // Attach single delegated click handler once
  if (!delegateAttached) {
    els.reportBody.addEventListener("click", (e) => {
      const row = e.target.closest("tr");
      if (!row) return;
      const index = Number(row.dataset.index);
      if (e.target.closest(".edit-btn")) editEntry(index);
      if (e.target.closest(".delete-btn")) deleteEntry(index);
    });
    delegateAttached = true;
  }
}

// Search binder (call during app init)
export function bindSearch() {
  if (!els.searchInput) return;
  els.searchInput.addEventListener("input", (e) => {
    const term = (e.target.value || "").trim();
    renderTable(term);
  });
}
