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
import { calculateExactSplit } from '../expenses/splitPreview';

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
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [formErrors, setFormErrors] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showSidebar, setShowSidebar] = useState(true);
    const [expenseFilter, setExpenseFilter] = useState('all'); // 'all', 'you_paid', 'you_involved'
    const [timePeriod, setTimePeriod] = useState('all'); // 'all', 'this_month', 'last_month', 'this_year'
    const [sortBy, setSortBy] = useState('date_desc'); // 'date_desc', 'date_asc', 'amount_desc', 'amount_asc'
    const [selectedMember, setSelectedMember] = useState(null);
    const [hoveredExpense, setHoveredExpense] = useState(null);
    const [showExportModal, setShowExportModal] = useState(false);


    // State for the expense form
    const [expenseForm, setExpenseForm] = useState({
        description: '',
        amount: '',
        paidBy: 'you',
        splitType: 'equal',
        date: new Date().toISOString().slice(0, 10),
        category: 'food',
        participants: [],
        notes: ''
    });

    // State for individual splits when using unequal, percentage, or shares
    const [splitValues, setSplitValues] = useState({});
    const [memberToRemove, setMemberToRemove] = useState(null);

    // §5.2 -- data comes from the seam. Loading and error are real query states.
    const numericGroupId = Number.parseInt(groupId, 10);
    const groupQuery = useGroup(numericGroupId);
    const expensesQuery = useGroupExpenses(numericGroupId);
    const balancesQuery = useGroupBalances(numericGroupId);
    const createExpense = useCreateExpense();
    const createSettlement = useCreateSettlement();

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

    // Handle sidebar toggle
    const toggleSidebar = () => {
        setShowSidebar(prev => !prev);
    };

    const toggleQuickAdd = () => {
        setIsQuickAddOpen(!isQuickAddOpen);
        // Reset form errors when opening/closing modal
        setFormErrors({});
    };

    // Handler for expense form input changes
    const handleExpenseFormChange = (e) => {
        const { name, value } = e.target;

        // Clear specific error when field is updated
        if (formErrors[name]) {
            setFormErrors({
                ...formErrors,
                [name]: undefined
            });
        }

        setExpenseForm(prev => ({
            ...prev,
            [name]: value
        }));

        // Reset split values if split type changes
        if (name === 'splitType') {
            const initialSplitValues = {};
            if (group) {
                group.members.forEach(member => {
                    initialSplitValues[member.id] = '';
                });
                setSplitValues(initialSplitValues);
            }
        }
    };

    // Validate amount input to ensure it's a proper currency value
    const handleAmountChange = (e) => {
        let value = e.target.value;

        // Allow empty value or valid currency input
        if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
            handleExpenseFormChange(e);
        }
    };

    // Handler for participant checkbox changes with minimum validation
    const handleParticipantChange = (memberId) => {
        setExpenseForm(prev => {
            const isAlreadyParticipant = prev.participants.includes(memberId);
            let updatedParticipants;

            if (isAlreadyParticipant) {
                // Don't allow deselecting if it would result in no participants
                if (prev.participants.length <= 1) {
                    setFormErrors({
                        ...formErrors,
                        participants: "At least one participant is required"
                    });
                    return prev;
                }

                updatedParticipants = prev.participants.filter(id => id !== memberId);
            } else {
                updatedParticipants = [...prev.participants, memberId];

                // Clear participant error if adding a participant
                if (formErrors.participants) {
                    setFormErrors({
                        ...formErrors,
                        participants: undefined
                    });
                }
            }

            return {
                ...prev,
                participants: updatedParticipants
            };
        });
    };

    // Handler for split value changes (unequal, percentage, shares)
    // With validation for numbers only
    const handleSplitValueChange = (memberId, value) => {
        // Validate input based on split type
        const { splitType } = expenseForm;

        if (splitType === 'unequal') {
            // Currency - allow empty or valid currency format
            if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                setSplitValues(prev => ({
                    ...prev,
                    [memberId]: value
                }));
            }
        } else if (splitType === 'percent') {
            // Percent - allow empty or valid percent (0-100)
            if (value === '' || (/^\d*\.?\d{0,2}$/.test(value) && parseFloat(value) <= 100)) {
                setSplitValues(prev => ({
                    ...prev,
                    [memberId]: value
                }));
            }
        } else if (splitType === 'shares') {
            // Shares - only allow positive integers
            if (value === '' || /^\d+$/.test(value)) {
                setSplitValues(prev => ({
                    ...prev,
                    [memberId]: value
                }));
            }
        }
    };

    // Calculate and validate split values based on split type
    const calculateSplitValues = () => {
        const { splitType, amount, participants } = expenseForm;

        if (!amount || participants.length === 0) return null;

        const parsedAmount = parseFloat(amount);

        // For equal split - use exact split calculation
        if (splitType === 'equal') {
            const equalShares = calculateExactSplit(parsedAmount, participants);
            const result = {};

            participants.forEach((participantId, index) => {
                result[participantId] = equalShares[index];
            });

            return result;
        }

        // For unequal split
        if (splitType === 'unequal') {
            // Validate if all participants have values
            const hasAllValues = participants.every(participantId => {
                return splitValues[participantId] !== '';
            });

            if (!hasAllValues) return null;

            // Calculate total with high precision
            let total = 0;
            participants.forEach(participantId => {
                total += parseFloat(splitValues[participantId] || 0);
            });

            // Check if the total matches the expense amount (allow small rounding differences)
            return Math.abs(total - parsedAmount) < 0.01 ? splitValues : null;
        }

        // For percentage split
        if (splitType === 'percent') {
            // Validate if all participants have values
            const hasAllValues = participants.every(participantId => {
                return splitValues[participantId] !== '';
            });

            if (!hasAllValues) return null;

            // Calculate total percentage
            let totalPercent = 0;
            participants.forEach(participantId => {
                totalPercent += parseFloat(splitValues[participantId] || 0);
            });

            // Check if percentages sum up to 100 (allow small rounding differences)
            if (Math.abs(totalPercent - 100) > 0.01) return null;

            // Calculate actual amounts based on percentages - fixed for exact distribution
            const percentValues = participants.map(id => parseFloat(splitValues[id]));
            const centsPerPercentage = Math.round(parsedAmount * 100) / 100;

            // Calculate the exact amount in cents for each person
            const result = {};
            let totalCents = 0;

            participants.forEach((participantId, index) => {
                const percent = percentValues[index];
                const amountInCents = Math.round(centsPerPercentage * percent);
                totalCents += amountInCents;
                result[participantId] = (amountInCents / 100).toFixed(2);
            });

            // Distribute any leftover cents
            const remainingCents = Math.round(parsedAmount * 100) - totalCents;
            if (remainingCents !== 0 && participants.length > 0) {
                const firstParticipant = participants[0];
                const currentAmount = parseFloat(result[firstParticipant]) * 100;
                result[firstParticipant] = ((currentAmount + remainingCents) / 100).toFixed(2);
            }

            return result;
        }

        // For shares split
        if (splitType === 'shares') {
            // Validate if all participants have values
            const hasAllValues = participants.every(participantId => {
                return splitValues[participantId] !== '' && parseInt(splitValues[participantId], 10) >= 0;
            });

            if (!hasAllValues) return null;

            // Calculate total shares
            let totalShares = 0;
            participants.forEach(participantId => {
                totalShares += parseInt(splitValues[participantId] || 0, 10);
            });

            if (totalShares === 0) return null;

            // Calculate amounts based on shares with proper distribution of remainders
            const amountInCents = Math.round(parsedAmount * 100);
            const result = {};
            let totalCents = 0;

            participants.forEach((participantId, index) => {
                const shares = parseInt(splitValues[participantId], 10);
                if (index === participants.length - 1) {
                    // Last person gets the remainder
                    const amountInCents = Math.round(parsedAmount * 100) - totalCents;
                    result[participantId] = (amountInCents / 100).toFixed(2);
                } else {
                    const shareAmount = Math.floor((shares / totalShares) * amountInCents);
                    totalCents += shareAmount;
                    result[participantId] = (shareAmount / 100).toFixed(2);
                }
            });

            return result;
        }

        return null;
    };

    // Validate the expense form
    const validateExpenseForm = () => {
        const errors = {};
        const { description, amount, participants } = expenseForm;

        if (!description.trim()) {
            errors.description = "Description is required";
        }

        if (!amount) {
            errors.amount = "Amount is required";
        } else if (parseFloat(amount) <= 0) {
            errors.amount = "Amount must be greater than zero";
        }

        if (participants.length === 0) {
            errors.participants = "At least one participant is required";
        }

        // Check split values
        const splitResults = calculateSplitValues();
        if (!splitResults && expenseForm.splitType !== 'equal' && amount) {
            errors.splitValues = "Please ensure the split values are correct";
        }

        return errors;
    };

    // Handler for saving the expense
    const handleSaveExpense = () => {
        // Validate form
        const errors = validateExpenseForm();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        const { description, amount, paidBy, category, date, participants, notes } = expenseForm;

        // Calculate split values
        const splitResults = calculateSplitValues();

        // Find the payer object
        const payer = paidBy === 'you'
            ? group.members.find(m => m.id === VIEWER_ID)
            : group.members.find(m => m.id === parseInt(paidBy));

        if (!payer) {
            setFormErrors({
                ...formErrors,
                paidBy: "Could not find the selected payer"
            });
            return;
        }

        // §5.2 write path: the port calls computeShares, so the split is produced
        // by @centiverse/core and the balance queries invalidate on success.
        // Non-negotiable 2: this component no longer computes a share.
        const participantIds = group.members
            .filter(member => participants.includes(member.id))
            .map(member => member.id);

        const toMinorUnits = (value) => Math.round(parseFloat(value) * 100);

        const strategy = (() => {
            if (expenseForm.splitType === 'unequal' && splitResults) {
                return {
                    kind: 'EXACT',
                    shares: Object.entries(splitResults).map(([userId, value]) => ({
                        userId: parseInt(userId, 10),
                        minor: toMinorUnits(value),
                    })),
                };
            }
            if (expenseForm.splitType === 'percent') {
                return {
                    kind: 'PERCENT',
                    shares: participantIds.map(userId => ({
                        userId,
                        bps: Math.round(parseFloat(splitValues[userId] || 0) * 100),
                    })),
                };
            }
            if (expenseForm.splitType === 'shares') {
                return {
                    kind: 'SHARES',
                    shares: participantIds.map(userId => ({
                        userId,
                        weight: parseInt(splitValues[userId] || 1, 10),
                    })),
                };
            }
            return { kind: 'EQUAL' };
        })();

        createExpense.mutate(
            {
                groupId: parseInt(groupId, 10),
                description,
                totalMinor: toMinorUnits(amount),
                currency: group.currency || 'INR',
                date,
                paidByUserId: payer.id,
                participantIds,
                strategy,
                category: {
                    id: category,
                    name: getCategoryName(category),
                    icon: getCategoryIcon(category),
                },
                ...(notes ? { notes } : {}),
            },
            {
                onError: (mutationError) =>
                    setFormErrors(prev => ({ ...prev, general: mutationError.message })),
            },
        );

        // Close modal and reset form
        setIsQuickAddOpen(false);
        resetExpenseForm();
    };

    // Reset form state
    const resetExpenseForm = () => {
        setExpenseForm({
            description: '',
            amount: '',
            paidBy: 'you',
            splitType: 'equal',
            date: new Date().toISOString().slice(0, 10),
            category: 'food',
            participants: group ? group.members.map(member => member.id) : [],
            notes: ''
        });

        // Reset split values
        const initialSplitValues = {};
        if (group) {
            group.members.forEach(member => {
                initialSplitValues[member.id] = '';
            });
        }
        setSplitValues(initialSplitValues);

        // Clear form errors
        setFormErrors({});
    };

    // Helper functions for categories
    const getCategoryName = (categoryId) => {
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

    const getCategoryIcon = (categoryId) => {
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
    const handleSettleUp = (memberId) => {
        if (!group) return;

        // Find the member
        const member = group.members.find(m => m.id === memberId);
        if (!member) return;

        // Get the balance for this member
        const balance = balances.find(b => b.id === memberId);
        if (!balance || balance.balance === 0) return;

        // Create a settlement expense
        const settlement = {
            id: Date.now(),
            groupId: parseInt(groupId),
            description: `Settlement with ${member.name}`,
            amount: Math.abs(balance.balance),
            date: new Date().toISOString().slice(0, 10),
            paidBy: balance.balance < 0
                ? member // They owe you
                : group.members.find(m => m.id === VIEWER_ID), // You owe them
            category: {
                id: 'other',
                name: 'Settlement',
                icon: '💰'
            },
            participants: [
                member,
                group.members.find(m => m.id === VIEWER_ID)
            ],
            isSettlement: true
        };

        // §4.4: a settlement is its own ledger entry between two real parties,
        // never a synthetic expense row.
        createSettlement.mutate({
            groupId: parseInt(groupId, 10),
            from: balance.balance < 0 ? member.id : VIEWER_ID,
            to: balance.balance < 0 ? VIEWER_ID : member.id,
            amountMinor: Math.round(Math.abs(balance.balance) * 100),
            currency: group.currency || 'INR',
            method: 'OTHER',
        });

        // Show success notification (in a real app)
        console.log('Settlement added:', settlement);
    };

    // Handle member removal with confirmation
    const handleRemoveMember = (memberId) => {
        if (!group) return;

        // Find the member
        const member = group.members.find(m => m.id === memberId);
        if (!member || member.id === VIEWER_ID) return;

        // Set up confirmation dialog
        setMemberToRemove(member);
        setConfirmAction(() => () => {
            // This would be an API call in a real app
            // const response = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
            //   method: 'DELETE',
            // });

            // if (!response.ok) {
            //   console.error('Failed to remove member');
            //   return;
            // }

            const updatedGroup = {
                ...group,
                members: group.members.filter(m => m.id !== memberId)
            };

            setGroup(updatedGroup);
            setIsConfirmDialogOpen(false);

            // Show success notification
            console.log(`Removed ${member.name} from group`);
        });

        setIsConfirmDialogOpen(true);
    };

    // §4.4 / non-negotiable 2: balances are DERIVED by @centiverse/core.
    // This used to compute `totalAmount / splitCount` in floats right here.
    const balances = useMemo(
        () => toLegacyBalances(balancesQuery.data),
        [balancesQuery.data],
    );

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
    const handleConfirmAction = () => {
        if (confirmAction) {
            confirmAction();
        }
        setIsConfirmDialogOpen(false);
    };

    const handleCancelConfirm = () => {
        setIsConfirmDialogOpen(false);
        setConfirmAction(null);
        setMemberToRemove(null);
    };

    // Loading state
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const myExpenses = expenses.filter(expense =>
        expense.paidBy.id === VIEWER_ID
    ).reduce((sum, expense) => sum + expense.amount, 0);

    // Calculate split info
    const splitInfo = calculateSplitValues();

    // Animation variants
    const pageVariants = {
        initial: { opacity: 0, y: 20 },
        animate: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                staggerChildren: 0.1
            }
        },
        exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
    };

    const itemVariants = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } },
        exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 25
            }
        },
        hover: {
            y: -5,
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
            transition: { type: "spring", stiffness: 400, damping: 25 }
        },
        tap: { scale: 0.98 }
    };

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
