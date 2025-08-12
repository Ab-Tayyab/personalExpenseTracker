let expenseData = JSON.parse(localStorage.getItem("expenseData")) || {};
        let editIndex = null;
        let showIndex = 5;

        const date = new Date();
        const fullDate = date.toISOString().split('T')[0];
        const monthKey = fullDate.slice(0, 7);
        document.getElementById('dateOutput').textContent = fullDate;

        let thisMonth = expenseData[monthKey];

        // Initialize thisMonth if it doesn't exist
        function initializeMonth() {
            if (!thisMonth) {
                thisMonth = { monthlyBudget: null, dailyExpenses: [] };
                expenseData[monthKey] = thisMonth;
            }
        }

        // get value from inputs and clean data then store in array and objects 
        function dailyExpense() {
            const setDate = document.getElementById('date').value;
            const foodExpense = Number(document.getElementById('food').value) || 0;
            const otherExpenseInput = document.getElementById('other');
            const otherText = otherExpenseInput.value.trim();

            if (!setDate || (foodExpense === 0 && otherText === '')) {
                return toastExecution('Please add entry!');
            }

            // Clean data or extract digits or number from input string 
            const otherTotal = (otherText.match(/\d+/g) || []).reduce((sum, val) => sum + Number(val), 0);
            const totalDailyExpense = foodExpense + otherTotal;

            initializeMonth();

            const newEntry = {
                date: setDate,
                food: foodExpense,
                other: otherText,
                total: totalDailyExpense,
            };

            if (totalDailyExpense > 0) {
                if (editIndex !== null) {
                    thisMonth.dailyExpenses[editIndex] = newEntry;
                    editIndex = null;
                    document.getElementById('dailyBtn').textContent = "Submit Daily Expense";
                    toastExecution('Entry Updated Successfully!');
                } else {
                    thisMonth.dailyExpenses.push(newEntry);
                    toastExecution('Entry Added Successfully!');
                }

                expenseData[monthKey] = thisMonth;
                localStorage.setItem('expenseData', JSON.stringify(expenseData));

                // Reset fields
                document.getElementById('date').value = '';
                document.getElementById('food').value = '';
                document.getElementById('other').value = '';
                calculate();
            } else {
                toastExecution('Not Valid Value!');
            }
        }

        // get value from inputs field and store 
        function monthlyIncome() {
            const totalIncome = Number(document.getElementById('total').value);
            const btn = document.getElementById('monthlyIncomeBtn');

            if (!totalIncome || totalIncome <= 0) {
                toastExecution('Please enter a valid monthly budget!');
                return;
            }

            initializeMonth();
            
            thisMonth.monthlyBudget = totalIncome;
            btn.disabled = true;
            
            expenseData[monthKey] = thisMonth;
            localStorage.setItem('expenseData', JSON.stringify(expenseData));

            document.getElementById('total').value = '';
            toastExecution('Monthly budget set successfully!');
            calculate();
        }

        // calculate and show data 
        function calculate() {
            initializeMonth();

            const totalMonthlyExpense = thisMonth.dailyExpenses.reduce((sum, entry) => sum + entry.total, 0);
            const remainingIncome = thisMonth.monthlyBudget !== null ? thisMonth.monthlyBudget - totalMonthlyExpense : 0;

            document.getElementById('monthlyExpenseOutput').textContent = totalMonthlyExpense;
            document.getElementById('totalBudgetOutput').textContent = thisMonth.monthlyBudget || 0;
            document.getElementById('remainingBudgetOutput').textContent = remainingIncome;

            // Calculate overall data across all months
            let overallFunds = 0;
            let overallExpenses = 0;
            let totalDays = 0;

            Object.values(expenseData).forEach(monthData => {
                if (monthData.monthlyBudget) overallFunds += monthData.monthlyBudget;
                const monthExpense = monthData.dailyExpenses.reduce((sum, entry) => sum + entry.total, 0);
                overallExpenses += monthExpense;
                totalDays += monthData.dailyExpenses.length;
            });

            const overallRemaining = overallFunds - overallExpenses;
            const avgDaily = totalDays > 0 ? (overallExpenses / totalDays).toFixed(2) : 0;
            const percentSpent = overallFunds > 0 ? ((overallExpenses / overallFunds) * 100).toFixed(1) : 0;

            document.getElementById('overallTotalFunds').textContent = overallFunds;
            document.getElementById('overallTotalExpenses').textContent = overallExpenses;
            document.getElementById('overallTotalRemaining').textContent = overallRemaining;
            document.getElementById('overallAvgDaily').textContent = avgDaily;
            document.getElementById('overallPercentage').textContent = percentSpent + '%';

            const reportBody = document.getElementById('reportBody');
            reportBody.innerHTML = '';

            // Create table and other html attribute dynamically 
            thisMonth.dailyExpenses
                .slice()
                .reverse() // Show newest first
                .forEach((entry, reverseIndex) => {
                    const index = thisMonth.dailyExpenses.length - 1 - reverseIndex; // Original index
                    if (reverseIndex < showIndex) {
                        const row = document.createElement('tr');

                        [entry.date, entry.food, entry.other, entry.total].forEach(val => {
                            const td = document.createElement('td');
                            td.textContent = val;
                            row.appendChild(td);
                        });

                        const td = document.createElement('td');
                        td.className = 'action-buttons';

                        const editBtn = document.createElement('button');
                        editBtn.className = 'edit-btn';
                        editBtn.onclick = () => editEntry(index);
                        editBtn.innerHTML = '<i class="fas fa-edit"></i>';

                        const deleteBtn = document.createElement('button');
                        deleteBtn.className = 'delete-btn';
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
                showBtn.style.display = 'none';
            } else {
                showBtn.style.display = 'inline-block';
            }

            // Update monthly income button state
            const monthlyBtn = document.getElementById('monthlyIncomeBtn');
            monthlyBtn.disabled = thisMonth.monthlyBudget !== null;
        }

        // delete entry by index 
        function deleteEntry(index) {
            if (confirm("Do you want to delete this entry?")) {
                thisMonth.dailyExpenses.splice(index, 1);
                expenseData[monthKey] = thisMonth;
                localStorage.setItem('expenseData', JSON.stringify(expenseData));
                toastExecution('Entry deleted successfully!');
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
            document.getElementById('dailyBtn').textContent = "Update Entry";
        }

        function showMore() {
            showIndex += 5;
            calculate();
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
                toast.classList.add('disable');
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

        // Initialize on load
        calculate();