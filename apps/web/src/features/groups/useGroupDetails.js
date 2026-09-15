import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    useGroup,
    useGroupExpenses,
    useGroupBalances,
    useCreateExpense,
    useCreateSettlement,
} from '../../data/hooks';
import { toLegacyExpenses, toLegacyBalances } from '../../data/legacy';
import { VIEWER_ID } from '../../shared/people/viewer';
import { pageVariants, itemVariants, containerVariants, cardVariants } from './animationVariants';
import { useExpenseForm } from '../expenses/useExpenseForm';
import { useGroupDialogs } from './useGroupDialogs';

/**
 * 7.4 -- the state, data loading and handlers that used to live inside
 * GroupDetails. Lifted verbatim so the page component is left composing markup,
 * which is what keeps it under the 300-line limit.
 *
 * Behaviour-preserving: the bodies are unchanged; only their home moved.
 */
export const useGroupDetails = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const [group, setGroup] = useState(null);
    const [expenses, setExpenses] = useState([]);
    // 7.4: the active tab is a route segment, so the URL is the source of truth.
    const location = useLocation();
    const activeTab = location.pathname.split('/')[3] ?? 'expenses';
    const [formErrors, setFormErrors] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expenseFilter, setExpenseFilter] = useState('all'); // 'all', 'you_paid', 'you_involved'
    const [timePeriod, setTimePeriod] = useState('all'); // 'all', 'this_month', 'last_month', 'this_year'
    const [sortBy, setSortBy] = useState('date_desc'); // 'date_desc', 'date_asc', 'amount_desc', 'amount_asc'
    const [selectedMember, setSelectedMember] = useState(null);
    const [hoveredExpense, setHoveredExpense] = useState(null);


    // State for the expense form

    // State for individual splits when using unequal, percentage, or shares

    // §5.2 -- data comes from the seam. Loading and error are real query states.
    const numericGroupId = Number.parseInt(groupId, 10);
    const groupQuery = useGroup(numericGroupId);
    const expensesQuery = useGroupExpenses(numericGroupId);
    const balancesQuery = useGroupBalances(numericGroupId);
    const createExpense = useCreateExpense();
    const createSettlement = useCreateSettlement();

    // §4.4 / non-negotiable 2: balances are DERIVED by @centiverse/core.
    // This used to compute `totalAmount / splitCount` in floats right here.
    const balances = useMemo(
        () => toLegacyBalances(balancesQuery.data),
        [balancesQuery.data],
    );

    // 7.4: dialogs (settle-up, member removal, confirmation) are their own hook.
    const {
        isQuickAddOpen,
        setIsQuickAddOpen,
        isConfirmDialogOpen,
        memberToRemove,
        showSidebar,
        toggleSidebar,
        showExportModal,
        setShowExportModal,
        handleSettleUp,
        handleRemoveMember,
        handleConfirmAction,
        handleCancelConfirm,
    } = useGroupDialogs({ group, setGroup, groupId, balances, createSettlement });

    // 7.4: the expense form is its own hook; the screen just wires it up.
    const {
        expenseForm,
        setExpenseForm,
        splitValues,
        setSplitValues,
        handleExpenseFormChange,
        handleAmountChange,
        handleParticipantChange,
        handleSplitValueChange,
        calculateSplitValues,
        handleSaveExpense,
        resetExpenseForm,
    } = useExpenseForm({
        group,
        groupId,
        createExpense,
        formErrors,
        setFormErrors,
        setIsQuickAddOpen,
    });


    useEffect(() => {
        setIsLoading(groupQuery.isPending || expensesQuery.isPending);
    }, [groupQuery.isPending, expensesQuery.isPending]);

    useEffect(() => {
        const failure = groupQuery.error ?? expensesQuery.error ?? null;
        setError(failure ? failure.message : null);
    }, [groupQuery.error, expensesQuery.error]);

    useEffect(() => {
        const selectedGroup = groupQuery.data;
        if (!selectedGroup) return;

        setGroup(selectedGroup);
        setExpenseForm(prev => ({
            ...prev,
            participants: selectedGroup.members.map(member => member.id),
        }));

        const initialSplitValues = {};
        selectedGroup.members.forEach(member => {
            initialSplitValues[member.id] = '';
        });
        setSplitValues(initialSplitValues);
    }, [groupQuery.data]);

    useEffect(() => {
        if (expensesQuery.data) setExpenses(toLegacyExpenses(expensesQuery.data));
    }, [expensesQuery.data]);

    const toggleQuickAdd = () => {
        setIsQuickAddOpen(!isQuickAddOpen);
        // Reset form errors when opening/closing modal
        setFormErrors({});
    };

    // Handler for expense form input changes



    // Format currency with proper locale support
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: group?.currency || 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    };

    // Filter expenses based on current filters
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
    const splitInfo = calculateSplitValues();

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


    return {
        activeTab,
        balances,
        balancesQuery,
        cardVariants,
        categoryTotals,
        containerVariants,
        error,
        expenseFilter,
        expenseForm,
        expenses,
        expensesQuery,
        filteredExpenses,
        formErrors,
        formatCurrency,
        group,
        groupQuery,
        handleAmountChange,
        handleCancelConfirm,
        handleConfirmAction,
        handleExpenseFormChange,
        handleParticipantChange,
        handleRemoveMember,
        handleSaveExpense,
        handleSettleUp,
        handleSplitValueChange,
        hoveredExpense,
        isConfirmDialogOpen,
        isLoading,
        isQuickAddOpen,
        itemVariants,
        memberToRemove,
        monthlyTotals,
        myExpenses,
        navigate,
        pageVariants,
        setExpenseFilter,
        setHoveredExpense,
        setShowExportModal,
        setSortBy,
        setTimePeriod,
        showExportModal,
        showSidebar,
        sortBy,
        splitValues,
        timePeriod,
        toggleQuickAdd,
        totalExpenses,
    };
};
