
let expenseData = JSON.parse(localStorage.getItem("expenseData")) || {};
// fetch date 
let date = new Date();
let fullDate = date.toISOString().split('T')[0];
let monthKey = fullDate.slice(0, 7);
document.getElementById('dateOutput').textContent = fullDate;

// get daily expense 
function dailyExpense() {
    let totalDailyExpense = 0;
    let getValue = '';
    let otherTotal = 0;
    let foodExpense = Number(document.getElementById('food').value);
    let otherExpense = document.getElementById('other');
    let splitData = otherExpense.value.split('')

    // if input field have no value 
    if (!foodExpense && otherExpense.value.trim() === '') {
        alert("Please Add entry at least one!")
        return
    }
    // get digit value from string 
    for (let i = 0; i < splitData.length; i++) {
        if (splitData[i] >= 0 || splitData[i] <= 9) {
            getValue += splitData[i];
        }
        else {
            if (getValue != '') {
                otherTotal += Number(getValue);
                getValue = ''
            }
        }
    }
    if (getValue != '') {
        otherTotal = Number(getValue)
    }
    totalDailyExpense = otherTotal + foodExpense;

    // initialize object and array 

    if (!expenseData[monthKey]) {
        expenseData[monthKey] = {
            monthlyBudget: null,
            dailyExpenses: []
        }
    }

    // data push into object 
    if (totalDailyExpense > 0) {

        expenseData[monthKey].dailyExpenses.push({
            date: fullDate,
            food: foodExpense,
            other: otherExpense.value,
            total: totalDailyExpense,
        })
    }
    else {
        alert("Not Valid Value")
    }
    localStorage.setItem('expenseData', JSON.stringify(expenseData));
    document.getElementById('food').value = '';
    document.getElementById('other').value = '';
    calculate();
}

function monthlyIncome() {
    let totalIncome = document.getElementById('total').value;
    let btn = document.getElementById('monthlyIncomeBtn');
    // data push into object 

    if (!expenseData[monthKey]) {
        expenseData[monthKey] = {
            monthlyBudget: totalIncome,
            dailyExpenses: []
        }
        btn.disabled = true;
    }
    else if (expenseData[monthKey].monthlyBudget === null) {
        expenseData[monthKey].monthlyBudget = totalIncome;
        btn.disabled = true;
        return
    }
    else {
        btn.disabled = true;
    }
    localStorage.setItem('expenseData', JSON.stringify(expenseData));
    document.getElementById('total').value = '';

    calculate();
}

function calculate() {
    let thisMonth = expenseData[monthKey];

    // for loop for get total monthly expense 
    let totalMonthlyExpense = 0;
    for (let i = 0; i < thisMonth.dailyExpenses.length; i++) {
        totalMonthlyExpense += thisMonth.dailyExpenses[i].total;
    }

    let remainingIncome = thisMonth.monthlyBudget !== null ? thisMonth.monthlyBudget - totalMonthlyExpense : 0;

    document.getElementById('monthlyExpenseOutput').textContent = + totalMonthlyExpense;
    document.getElementById('totalBudgetOutput').textContent = expenseData[monthKey].monthlyBudget;
    document.getElementById('remainingBudgetOutput').textContent = + remainingIncome;
    document.getElementById('reportBody').innerHTML = '';

    // for loop for display data

    for (let i = 0; i < thisMonth.dailyExpenses.length; i++) {
        let entry = thisMonth.dailyExpenses[i];

        let row = document.createElement('tr')
        let dateTD = document.createElement('td')
        dateTD.textContent = entry.date;
        row.appendChild(dateTD);

        let foodTD = document.createElement('td')
        foodTD.textContent = entry.food;
        row.appendChild(foodTD);

        let otherTD = document.createElement('td')
        otherTD.textContent = entry.other;
        row.appendChild(otherTD);

        let totalTD = document.createElement('td')
        totalTD.textContent = entry.total;
        row.appendChild(totalTD);

        document.getElementById('reportBody').appendChild(row)

    }
}
calculate()