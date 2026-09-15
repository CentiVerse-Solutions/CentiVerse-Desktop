/**
 * Expense category lookups. Pure data, lifted out of useExpenseForm -- they were
 * only in a hook because that is where the component body declared them.
 *
 * Phase 5 replaces these with the `categories` table from 6.2.
 */
export const getCategoryName = (categoryId) => {
    const categories = {
        food: 'Food & Drink',
        accommodation: 'Accommodation',
        transportation: 'Transportation',
        entertainment: 'Entertainment',
        utilities: 'Utilities',
        rent: 'Rent/Mortgage',
        groceries: 'Groceries',
        shopping: 'Shopping',
        travel: 'Travel',
        medical: 'Medical',
        other: 'Other'
    };
    return categories[categoryId] || 'Other';
};

export const getCategoryIcon = (categoryId) => {
    const icons = {
        food: '🍔',
        accommodation: '🏠',
        transportation: '🚕',
        entertainment: '🎭',
        utilities: '💡',
        rent: '🏢',
        groceries: '🛒',
        shopping: '🛍️',
        travel: '✈️',
        medical: '💊',
        other: '📦'
    };
    return icons[categoryId] || '📦';
};

// Handle settle up button click
