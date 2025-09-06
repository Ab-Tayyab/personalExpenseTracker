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

export function showLogin() {
  els.loginScreen.style.display = "flex";
  els.trackerScreen.style.display = "none";
}

export function showTracker() {
  els.loginScreen.style.display = "none";
  els.trackerScreen.style.display = "block";
  calculate();
}

// --- Stats (top cards)
export function updateStatsUI(thisMonth, totalMonthlyExpense, remainingIncome) {
  els.monthlyExpenseOutput.textContent = totalMonthlyExpense;
  els.totalBudgetOutput.textContent = thisMonth.monthlyBudget || 0;
  els.remainingBudgetOutput.textContent = remainingIncome;
}

// --- Overall (bottom row)
export function updateOverallUI({ overallFunds, overallExpenses, overallRemaining }) {
  els.overallTotalFunds.textContent = overallFunds;
  els.overallTotalExpenses.textContent = overallExpenses;
  els.overallTotalRemaining.textContent = overallRemaining;
}

// --- Table
export function updateExpenseTable(thisMonth) {
  els.reportBody.innerHTML = "";
  const showIndex = getShowIndex();

  thisMonth.dailyExpenses
    .slice()
    .reverse()
    .forEach((entry, reverseIndex) => {
      const index = thisMonth.dailyExpenses.length - 1 - reverseIndex;
      if (reverseIndex < showIndex) {
        els.reportBody.insertAdjacentHTML(
          "beforeend",
          `
          <tr data-index="${index}">
            <td>${entry.date}</td>
            <td>${entry.amount}</td>
            <td>${entry.type}</td>
            <td class="action-buttons">
              <button class="edit-btn" title="Edit"><i class="fas fa-edit"></i></button>
              <button class="delete-btn" title="Delete"><i class="fas fa-trash"></i></button>
            </td>
          </tr>
        `
        );
      }
    });

  els.showMoreBtn.style.display =
    thisMonth.dailyExpenses.length <= showIndex ? "none" : "block";

  // Event delegation
  els.reportBody.onclick = (e) => {
    const row = e.target.closest("tr");
    if (!row) return;
    const index = Number(row.dataset.index);

    if (e.target.closest(".edit-btn")) editEntry(index);
    if (e.target.closest(".delete-btn")) deleteEntry(index);
  };
}

// --- Search filter (by date/type/amount text match)
export function bindSearch() {
  if (!els.searchInput) return;
  els.searchInput.addEventListener("input", () => {
    const term = els.searchInput.value.trim().toLowerCase();
    const rows = els.reportBody.querySelectorAll("tr");
    rows.forEach((row) => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(term) ? "" : "none";
    });
  });
}
