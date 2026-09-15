/**
 * 7.4 -- CSV and JSON generation for the group export, as pure functions of the
 * ledger and the chosen options.
 *
 * They were closures over the modal's state; taking that state as an argument
 * makes them testable and leaves the component doing presentation only.
 * Behaviour-preserving: the bodies are unchanged.
 */
export const filterExpensesByDate = (expenses, { dateRange, customDateStart, customDateEnd }) => {
    if (dateRange === 'all') {
        return expenses;
    }

    const now = new Date();
    let startDate;

    if (dateRange === 'custom' && customDateStart && customDateEnd) {
        startDate = new Date(customDateStart);
        const endDate = new Date(customDateEnd);
        endDate.setHours(23, 59, 59, 999); // End of day

        return expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate >= startDate && expenseDate <= endDate;
        });
    } else if (dateRange === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (dateRange === 'quarter') {
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
    } else if (dateRange === 'year') {
        startDate = new Date(now.getFullYear(), 0, 1);
    } else {
        return expenses;
    }

    return expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= startDate && expenseDate <= now;
    });
};

// Generate CSV data
export const generateCsvData = ({ expenses, balances, members, dateRange, customDateStart, customDateEnd, selectedData }) => {
    let csvContent = '';
    const filteredExpenses = filterExpensesByDate(expenses, { dateRange, customDateStart, customDateEnd });

    // Add expenses data
    if (selectedData.expenses && filteredExpenses.length > 0) {
        csvContent += 'EXPENSES\n';
        csvContent += 'Date,Description,Amount,Paid By,Category,Participants\n';

        filteredExpenses.forEach(expense => {
            const date = new Date(expense.date).toLocaleDateString();
            const description = `"${expense.description}"`;
            const amount = expense.amount;
            const paidBy = expense.paidBy.name;
            const category = expense.category ? expense.category.name : '';
            const participants = expense.participants.map(p => p.name).join('; ');

            csvContent += `${date},${description},${amount},${paidBy},${category},"${participants}"\n`;
        });

        csvContent += '\n';
    }

    // Add balances data
    if (selectedData.balances && balances && balances.length > 0) {
        csvContent += 'BALANCES\n';
        csvContent += 'Member,Balance\n';

        balances.forEach(balance => {
            csvContent += `${balance.name},${balance.balance}\n`;
        });

        csvContent += '\n';
    }

    // Add members data
    if (selectedData.members && members && members.length > 0) {
        csvContent += 'MEMBERS\n';
        csvContent += 'Name,Email\n';

        members.forEach(member => {
            csvContent += `${member.name},${member.email || ''}\n`;
        });

        csvContent += '\n';
    }

    // Add summary data
    if (selectedData.summary) {
        csvContent += 'SUMMARY\n';
        const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const expenseCount = filteredExpenses.length;
        const memberCount = members ? members.length : 0;

        csvContent += 'Metric,Value\n';
        csvContent += `Total Expenses,${totalExpenses}\n`;
        csvContent += `Number of Expenses,${expenseCount}\n`;
        csvContent += `Number of Members,${memberCount}\n`;

        if (dateRange !== 'all') {
            csvContent += `Date Range,${dateRange}\n`;
        }
    }

    return csvContent;
};

// Generate JSON data
export const generateJsonData = ({ group, expenses, balances, members, dateRange, customDateStart, customDateEnd, selectedData }) => {
    const filteredExpenses = filterExpensesByDate(expenses, { dateRange, customDateStart, customDateEnd });
    const data = {
        group: {
            id: group.id,
            name: group.name,
            createdAt: group.createdAt,
            currency: group.currency
        },
        exportDate: new Date().toISOString(),
        dateRange: dateRange
    };

    if (selectedData.expenses) {
        data.expenses = filteredExpenses;
    }

    if (selectedData.balances && balances) {
        data.balances = balances;
    }

    if (selectedData.members && members) {
        data.members = members;
    }

    if (selectedData.summary) {
        data.summary = {
            totalExpenses: filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0),
            expenseCount: filteredExpenses.length,
            memberCount: members ? members.length : 0
        };
    }

    return JSON.stringify(data, null, 2);
};

// Handle download
