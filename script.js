let totalMonthlyExpense = document.getElementById('tExpense');
let totalRemainingIncome = document.getElementById('rIncome');
let totalExpense = 0;
function calculate() {
    let foodExpense = document.getElementById('food');
    let otherExpense = document.getElementById('other')
    let splitData = otherExpense.value.split('')
    let getValue = '';
    for (let i = 0; i < splitData.length; i++) {
        if (splitData[i] >= 0 || splitData[i] <= 9) {
            getValue += splitData[i];
        }
    }

    let extractOtherExpenseValue = Number(getValue);
    let extractFoodExpenseValue = Number(foodExpense.value);
    totalExpense = extractOtherExpenseValue + extractFoodExpenseValue;
    totalMonthlyExpense.textContent = "Total Monthly Expense: Rs. "+ totalExpense;
}

function getIncome() {
    let totalIncome = document.getElementById('total')
    console.log(totalIncome.value)
    let extractTotalIncome = Number(totalIncome.value);
    totalRemainingIncome.textContent = "Remaining Budget: Rs. " + (extractTotalIncome - totalExpense) 

}
