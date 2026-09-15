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
import { useGroupLedger } from './useGroupLedger';

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

    // 7.4: filtering and the chart aggregations live in their own hook.
    const { filteredExpenses, totalExpenses, myExpenses, categoryTotals, monthlyTotals } =
        useGroupLedger({ expenses, expenseFilter, timePeriod, sortBy, selectedMember });

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
    const splitInfo = calculateSplitValues();

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
