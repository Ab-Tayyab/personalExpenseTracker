
// const api = {
//   "totalFunds": 65000,
//   "months": [
//     {
//       "monthKey": "2025-08",
//       "monthlyBudget": 30000,
//       "dailyExpenses": [
//         {
//           "date": "2025-08-08",
//           "food": 150,
//           "other": "7000 Hostel Rent",
//           "total": 7150,
//           "remainingAfterExpense": 22850
//         }
//       ],
//       "monthlyExpenseTotal": 7150,
//       "monthlyRemaining": 22850
//     },
//   ],
//   "overall": {
//     "totalBudget": 50000,         
//     "totalExpenses": 7650,        
//     "totalRemaining": 42350,      
//     "averageDailyExpense": 3825,  
//     "percentageSpent": "15.3%"    
//   }
// }


let expenseData = JSON.parse(localStorage.getItem("expenseData")) || {};
let editIndex = null;
let showIndex = 5;

const date = new Date();
const fullDate = date.toISOString().split('T')[0];
const monthKey = fullDate.slice(0, 7);
document.getElementById('dateOutput').textContent = fullDate;

let thisMonth = expenseData[monthKey];

// get value from inputs and clean data then store in array and obects 

function dailyExpense() {
    const setDate = document.getElementById('date').value;
    const foodExpense = Number(document.getElementById('food').value);
    const otherExpenseInput = document.getElementById('other');
    const otherText = otherExpenseInput.value.trim();

    if (!setDate || !foodExpense && otherText === '') return toastExecution('Please add entry!');

    //   clean data or extract digits or number from input string 
    const otherTotal = (otherText.match(/\d+/g) || []).reduce((sum, val) => sum + Number(val), 0);
    const totalDailyExpense = foodExpense + otherTotal;


    if (!thisMonth) {
        thisMonth = { monthlyBudget: null, dailyExpenses: [] };
    }

    const newEntry = {
        date: setDate,
        food: foodExpense,
        other: otherText,
        total: totalDailyExpense,
    };

    if (totalDailyExpense > 0) {
        if (editIndex != null) {
            thisMonth.dailyExpenses[editIndex] = newEntry;
            editIndex = null;
            document.getElementById('dailyBtn').textContent = "Submit Daily Expense";
            toastExecution('Entry Update Successfully!')
        } else {
            thisMonth.dailyExpenses.push(newEntry);
            toastExecution('Entry Add Successfully!')
        }

        expenseData[monthKey] = thisMonth;
        localStorage.setItem('expenseData', JSON.stringify(expenseData));

        // Reset fields
        document.getElementById('date').value = '';
        document.getElementById('food').value = '';
        document.getElementById('other').value = '';
        calculate();
    } else {
        toastExecution('Not Valid Value!')
    }
}

// get value from inputs field and store 
function monthlyIncome() {
    const totalIncome = Number(document.getElementById('total').value);
    const btn = document.getElementById('monthlyIncomeBtn');

    if (!thisMonth) {
        thisMonth = { monthlyBudget: totalIncome, dailyExpenses: [] };
    } else if (thisMonth.monthlyBudget === null) {
        thisMonth.monthlyBudget = totalIncome;
    }

    btn.disabled = true;
    expenseData[monthKey] = thisMonth;
    localStorage.setItem('expenseData', JSON.stringify(expenseData));

    document.getElementById('total').value = '';
    calculate();
}

// calculate and show data 

function calculate() {
    if (!thisMonth) return;

    const totalMonthlyExpense = thisMonth.dailyExpenses.reduce((sum, entry) => sum + entry.total, 0);
    const remainingIncome = thisMonth.monthlyBudget !== null ? thisMonth.monthlyBudget - totalMonthlyExpense : 0;

    document.getElementById('monthlyExpenseOutput').textContent = totalMonthlyExpense;
    document.getElementById('totalBudgetOutput').textContent = thisMonth.monthlyBudget || 0;
    document.getElementById('remainingBudgetOutput').textContent = remainingIncome;

    const reportBody = document.getElementById('reportBody');
    reportBody.innerHTML = '';

    
// delete entry by index 
function deleteEntry(index) {
    if (confirm("Do you want to delete this entry?")) {
        thisMonth.dailyExpenses.splice(index, 1);
        expenseData[monthKey] = thisMonth;
        localStorage.setItem('expenseData', JSON.stringify(expenseData));
        calculate();
    }
}

// edit entry by index 
function editEntry(index) {
    const entry = thisMonth.dailyExpenses[index];
    document.getElementById('date').value = entry.date;
    document.getElementById('food').value = entry.food;
    document.getElementById('other').value = entry.other;

    editIndex = index;
    document.getElementById('dailyBtn').textContent = "Update";
}

//   create table and other html attribute dynamically 

    thisMonth.dailyExpenses.forEach(({ date, food, other, total }, index) => {
        if (index < showIndex) {
            const row = document.createElement('tr');

            [date, food, other, total].forEach(val => {
                const td = document.createElement('td');
                td.textContent = val;
                row.appendChild(td);
            });

            const td = document.createElement('td');

            const editBtn = document.createElement('button');
            editBtn.id = `edit-btn-${index}`;
            editBtn.onclick = () => editEntry(index);
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.style.marginRight = "5px";

            const deleteBtn = document.createElement('button');
            deleteBtn.id = `delete-btn-${index}`;
            deleteBtn.onclick = () => deleteEntry(index);
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';

            td.appendChild(editBtn);
            td.appendChild(deleteBtn);
            row.appendChild(td);

            reportBody.appendChild(row);
        }
    });
    let showBtn = document.getElementById('showMore');
    if (thisMonth.dailyExpenses.length <= showIndex) {
        showBtn.style.display = 'none'
    }
    else {
        showBtn.style.display = 'inline-block'
    }
}

function showMore() {
    showIndex += 5;
    calculate()
}
// toast notification 

let toast = document.getElementById('toast');
let toastHeading = document.getElementById('toast-content');

function toastExecution(content) {
    toastHeading.textContent = content;
    toast.classList.remove('disable');
    toast.classList.add('active');
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

function closeToast() {
    toast.classList.remove('active');
    toast.classList.add('disable');
}


// Redirect if not logged in
if (localStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "../structure/login.html";
}

// Logout function
function logout() {
    localStorage.removeItem("isLoggedIn");
    window.location.href = "../structure/login.html";
}


calculate();

