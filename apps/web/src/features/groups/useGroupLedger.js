import { useMemo } from 'react';
import { VIEWER_ID } from '../../shared/people/viewer';

/**
 * 7.4 -- the group screen's derived views: expense filtering/sorting and the
 * category and month aggregations the Analysis tab charts.
 *
 * Pure functions of (expenses, filters), lifted out of useGroupDetails verbatim.
 * Balances are NOT here -- those come from @centiverse/core via the port (4.4).
 */
export const useGroupLedger = ({ expenses, expenseFilter, timePeriod, sortBy, selectedMember }) => {
    const filteredExpenses = useMemo(() => {
        if (!expenses.length) return [];

        let result = [...expenses];

        // Filter by who paid
        if (expenseFilter === 'you_paid') {
            result = result.filter(expense =>
                expense.paidBy.id === VIEWER_ID
            );
        } else if (expenseFilter === 'you_involved') {
            result = result.filter(expense =>
                expense.participants.some(p => p.id === VIEWER_ID)
            );
        }

        // Filter by time period
        const now = new Date();
        if (timePeriod === 'this_month') {
            const thisMonth = now.getMonth();
            const thisYear = now.getFullYear();
            result = result.filter(expense => {
                const expenseDate = new Date(expense.date);
                return expenseDate.getMonth() === thisMonth &&
                    expenseDate.getFullYear() === thisYear;
            });
        } else if (timePeriod === 'last_month') {
            const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
            const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
            result = result.filter(expense => {
                const expenseDate = new Date(expense.date);
                return expenseDate.getMonth() === lastMonth &&
                    expenseDate.getFullYear() === lastMonthYear;
            });
        } else if (timePeriod === 'this_year') {
            const thisYear = now.getFullYear();
            result = result.filter(expense => {
                const expenseDate = new Date(expense.date);
                return expenseDate.getFullYear() === thisYear;
            });
        }

        // Apply sorting
        if (sortBy === 'date_desc') {
            result.sort((a, b) => new Date(b.date) - new Date(a.date));
        } else if (sortBy === 'date_asc') {
            result.sort((a, b) => new Date(a.date) - new Date(b.date));
        } else if (sortBy === 'amount_desc') {
            result.sort((a, b) => b.amount - a.amount);
        } else if (sortBy === 'amount_asc') {
            result.sort((a, b) => a.amount - b.amount);
        }

        // If a specific member is selected, only show expenses involving them
        if (selectedMember) {
            result = result.filter(expense =>
                expense.paidBy.id === selectedMember ||
                expense.participants.some(p => p.id === selectedMember)
            );
        }

        return result;
    }, [expenses, expenseFilter, timePeriod, sortBy, selectedMember]);

    // Handle confirmation dialog

    // Loading state

    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const myExpenses = expenses.filter(expense =>
        expense.paidBy.id === VIEWER_ID
    ).reduce((sum, expense) => sum + expense.amount, 0);

    // Calculate split info

    // Animation variants
    // Get unique categories from expenses
    const categories = {};
    expenses.forEach(expense => {
        if (!expense.category) return;
        if (!categories[expense.category.id]) {
            categories[expense.category.id] = {
                ...expense.category,
                total: 0
            };
        }
        categories[expense.category.id].total += expense.amount;
    });

    const categoryTotals = Object.values(categories).sort((a, b) => b.total - a.total);

    // Group expenses by month for visualization
    const expensesByMonth = {};
    expenses.forEach(expense => {
        const date = new Date(expense.date);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!expensesByMonth[monthYear]) {
            expensesByMonth[monthYear] = {
                month: date.toLocaleString('default', { month: 'short' }),
                year: date.getFullYear(),
                total: 0
            };
        }

        expensesByMonth[monthYear].total += expense.amount;
    });

    const monthlyTotals = Object.values(expensesByMonth).sort((a, b) => {
        const aDate = new Date(a.year, Object.keys(expensesByMonth).find(key => expensesByMonth[key] === a).split('-')[1] - 1);
        const bDate = new Date(b.year, Object.keys(expensesByMonth).find(key => expensesByMonth[key] === b).split('-')[1] - 1);
        return aDate - bDate;
    });

    // Render the split details based on split type


    return { filteredExpenses, totalExpenses, myExpenses, categoryTotals, monthlyTotals };
};
