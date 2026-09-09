import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
    Users,
    DollarSign,
    BarChart2,
    User,
    Clock,
    Calendar,
    Tag,
    PlusCircle,
    Settings,
    Trash2,
    Edit2,
    Share2,
    Download,
    Repeat,
    ChevronRight,
    ChevronDown,
    Check,
    X,
    Info,
    ArrowUpRight,
    ArrowDownLeft,
    RefreshCw,
    PenSquare,
    Upload
} from 'lucide-react';
import {
    ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    LineChart, Line, Area, AreaChart, ComposedChart,
    RadialBarChart, RadialBar, LabelList
} from 'recharts';
import Whiteboard from '../../components/groups/Whiteboard/Whiteboard';
import GroupExport from '../../components/groups/GroupExport/GroupExport';
import './GroupDetails.css';

// Import mock data for testing
import { mockGroups, mockExpenses, mockFriends } from '../../utils/mockData';
import { VIEWER_ID } from '../../shared/people/viewer';

// Utility functions for financial calculations - moved from component for clarity
const calculateExactSplit = (amount, numParticipants) => {
    // Use exact cents calculations to avoid floating point issues
    const amountInCents = Math.round(amount * 100);
    const shareInCents = Math.floor(amountInCents / numParticipants);

    // Calculate remainder to distribute
    const remainderCents = amountInCents - (shareInCents * numParticipants);

    // Create array of shares with base amount
    const shares = Array(numParticipants).fill(shareInCents);

    // Distribute the remainder one cent at a time
    for (let i = 0; i < remainderCents; i++) {
        shares[i]++;
    }

    // Convert back to dollars
    return shares.map(cents => (cents / 100).toFixed(2));
};

const GroupDetails = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const [group, setGroup] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [activeTab, setActiveTab] = useState('expenses');
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

    // Memoized fetch function to avoid recreation on each render
    const fetchGroupData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Simulate API call with delay
            await new Promise(resolve => setTimeout(resolve, 500));

            // In a real app, these would be API calls
            // const response = await fetch(`/api/groups/${groupId}`);
            // if (!response.ok) throw new Error('Failed to fetch group data');
            // const groupData = await response.json();

            // For now, use mock data
            const selectedGroup = mockGroups.find(g => g.id === parseInt(groupId));

            if (!selectedGroup) {
                // Handle 404 - Group not found
                setError('Group not found');
                navigate('/groups');
                return;
            }

            const groupExpenses = mockExpenses.filter(e => e.groupId === parseInt(groupId));

            setGroup(selectedGroup);
            setExpenses(groupExpenses);

            // Initialize participants with all group members checked
            if (selectedGroup) {
                const initialParticipants = selectedGroup.members.map(member => member.id);
                setExpenseForm(prev => ({
                    ...prev,
                    participants: initialParticipants
                }));

                // Initialize empty split values for all members
                const initialSplitValues = {};
                selectedGroup.members.forEach(member => {
                    initialSplitValues[member.id] = '';
                });
                setSplitValues(initialSplitValues);
            }
        } catch (error) {
            console.error("Error fetching group data:", error);
            setError('Failed to load group data. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }, [groupId, navigate]);

    // Load data on mount or when groupId changes
    useEffect(() => {
        fetchGroupData();
    }, [fetchGroupData]);

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
            const equalShares = calculateExactSplit(parsedAmount, participants.length);
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

        // Create new expense object
        const newExpense = {
            id: Date.now(), // Use timestamp as unique ID
            groupId: parseInt(groupId),
            description,
            amount: parseFloat(amount),
            date,
            paidBy: payer,
            category: {
                id: category,
                name: getCategoryName(category),
                icon: getCategoryIcon(category)
            },
            participants: group.members.filter(member => participants.includes(member.id)),
            splitValues: splitResults || {}, // Fallback to empty object if null
            notes: notes || ""
        };

        // In a real app, we would call an API here
        // const response = await fetch('/api/expenses', {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //   },
        //   body: JSON.stringify(newExpense),
        // });

        // if (!response.ok) {
        //   setFormErrors({ general: 'Failed to save expense. Please try again.' });
        //   return;
        // }

        // const savedExpense = await response.json();
        // setExpenses([savedExpense, ...expenses]);

        // For now, just use the mocked data
        setExpenses([newExpense, ...expenses]);

        // Close modal and reset form
        setIsQuickAddOpen(false);
        resetExpenseForm();

        // Show success notification (in a real app)
        console.log('New expense added:', newExpense);
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

        // In a real app, this would be an API call
        // const response = await fetch('/api/settlements', {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //   },
        //   body: JSON.stringify(settlement),
        // });

        // if (!response.ok) {
        //   console.error('Failed to save settlement');
        //   return;
        // }

        // const savedSettlement = await response.json();
        // setExpenses([savedSettlement, ...expenses]);

        // For now, just use the mocked data
        setExpenses([settlement, ...expenses]);

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

    // Calculate balances based on expenses
    const balances = useMemo(() => {
        if (!group || !expenses.length) return [];

        // Create a balance object for each member
        const balances = {};
        group.members.forEach(member => {
            balances[member.id] = {
                id: member.id,
                name: member.name,
                avatar: member.avatar,
                balance: 0,
            };
        });

        // Process each expense to calculate balances
        expenses.forEach(expense => {
            const paidBy = expense.paidBy.id;
            const totalAmount = expense.amount;

            // If we have split values, use them
            if (expense.splitValues && Object.keys(expense.splitValues).length > 0) {
                // The person who paid gets credited the full amount
                balances[paidBy].balance += totalAmount;

                // Each participant gets debited their share
                Object.entries(expense.splitValues).forEach(([participantId, amount]) => {
                    if (balances[participantId]) {
                        balances[participantId].balance -= parseFloat(amount);
                    }
                });
            } else {
                // Fallback to equal split
                const splitCount = expense.participants.length;
                const amountPerPerson = totalAmount / splitCount;

                // Add to the person who paid
                balances[paidBy].balance += totalAmount;

                // Subtract from each participant
                expense.participants.forEach(participant => {
                    balances[participant.id].balance -= amountPerPerson;
                });
            }
        });

        return Object.values(balances);
    }, [group, expenses]);

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
    if (isLoading) {
        return (
            <div className="loading-container" role="alert" aria-live="polite">
                <motion.div
                    className="loading-spinner"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    aria-hidden="true"
                ></motion.div>
                <motion.div className="loading-skeleton">
                    <div className="skeleton-header"></div>
                    <div className="skeleton-group">
                        <div className="skeleton-avatar"></div>
                        <div className="skeleton-text">
                            <div className="skeleton-title"></div>
                            <div className="skeleton-subtitle"></div>
                        </div>
                    </div>
                    <div className="skeleton-tabs"></div>
                    <div className="skeleton-cards">
                        <div className="skeleton-card"></div>
                        <div className="skeleton-card"></div>
                        <div className="skeleton-card"></div>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="error-container">
                <motion.div
                    className="error-icon"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                >
                    ⚠️
                </motion.div>
                <h2>Something went wrong</h2>
                <p>{error}</p>
                <motion.button
                    className="action-btn primary"
                    onClick={() => fetchGroupData()}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    Try Again
                </motion.button>
            </div>
        );
    }

    // If no group data
    if (!group) {
        return (
            <div className="error-container">
                <motion.div
                    className="error-icon"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                >
                    🔍
                </motion.div>
                <h2>Group Not Found</h2>
                <p>We couldn't find the group you're looking for.</p>
                <motion.button
                    className="action-btn primary"
                    onClick={() => navigate('/groups')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    Back to Groups
                </motion.button>
            </div>
        );
    }

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
    const renderSplitDetails = () => {
        const { splitType, participants, amount } = expenseForm;

        if (participants.length === 0) {
            return (
                <div className="form-message" role="alert">
                    Please select at least one participant
                </div>
            );
        }

        // Get participating members
        const participatingMembers = group.members.filter(member =>
            participants.includes(member.id)
        );

        // Equal split
        if (splitType === 'equal') {
            const parsedAmount = amount ? parseFloat(amount) : 0;
            const equalShares = parsedAmount > 0
                ? calculateExactSplit(parsedAmount, participants.length)
                : Array(participants.length).fill('0.00');

            return (
                <div className="split-details" data-type="equal">
                    <p className="split-info">
                        Each person pays: {parsedAmount ? formatCurrency(parseFloat(equalShares[0])) : '—'}
                    </p>
                    <div className="split-list">
                        {participatingMembers.map((member, index) => (
                            <motion.div
                                key={member.id}
                                className="split-item"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ scale: 1.02, backgroundColor: "rgba(163, 201, 168, 0.1)" }}
                            >
                                <div className="split-member">
                                    <div className="user-avatar small">
                                        <img src={member.avatar} alt={member.name} />
                                    </div>
                                    <span>{member.name}</span>
                                </div>
                                <span className="split-amount">{parsedAmount ? formatCurrency(parseFloat(equalShares[index])) : '—'}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            );
        }

        // Unequal split - manual amount entry
        if (splitType === 'unequal') {
            const parsedAmount = amount ? parseFloat(amount) : 0;

            // Calculate current total
            const currentTotal = participatingMembers.reduce((sum, member) => {
                return sum + parseFloat(splitValues[member.id] || 0);
            }, 0);

            // Check if values sum up to the total amount
            const isValid = Math.abs(currentTotal - parsedAmount) < 0.01;
            const remainder = parsedAmount - currentTotal;

            return (
                <div className="split-details" data-type="unequal">
                    <div className="split-info">
                        <p>Enter amount for each person</p>
                        {parsedAmount > 0 && (
                            <div className={`split-total ${isValid ? 'valid' : 'invalid'}`}>
                                {isValid
                                    ? 'Total matches expense amount ✓'
                                    : `${formatCurrency(remainder)} ${remainder > 0 ? 'remaining' : 'over'}`}
                            </div>
                        )}
                    </div>
                    <div className="split-list">
                        {participatingMembers.map((member, index) => (
                            <motion.div
                                key={member.id}
                                className="split-item"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ scale: 1.02, backgroundColor: "rgba(163, 201, 168, 0.1)" }}
                            >
                                <div className="split-member">
                                    <div className="user-avatar small">
                                        <img src={member.avatar} alt={member.name} />
                                    </div>
                                    <span>{member.name}</span>
                                </div>
                                <div className={`split-input ${splitValues[member.id] ? 'valid' : ''}`}>
                                    <span className="currency-symbol" aria-hidden="true">
                                        {group.currency === 'INR' ? '₹' : '$'}
                                    </span>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="0.00"
                                        aria-label={`Amount for ${member.name}`}
                                        value={splitValues[member.id]}
                                        onChange={(e) => handleSplitValueChange(member.id, e.target.value)}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    {formErrors.splitValues && (
                        <p className="form-error" role="alert">{formErrors.splitValues}</p>
                    )}
                </div>
            );
        }

        // Percentage split
        if (splitType === 'percent') {
            const parsedAmount = amount ? parseFloat(amount) : 0;

            // Calculate current total percentage
            const currentTotal = participatingMembers.reduce((sum, member) => {
                return sum + parseFloat(splitValues[member.id] || 0);
            }, 0);

            // Check if percentages sum up to 100%
            const isValid = Math.abs(currentTotal - 100) < 0.01;
            const remainder = 100 - currentTotal;

            return (
                <div className="split-details" data-type="percent">
                    <div className="split-info">
                        <p>Enter percentage for each person</p>
                        {parsedAmount > 0 && (
                            <div className={`split-total ${isValid ? 'valid' : 'invalid'}`}>
                                {isValid
                                    ? 'Percentages add up to 100% ✓'
                                    : `${remainder.toFixed(2)}% ${remainder > 0 ? 'remaining' : 'over'}`}
                            </div>
                        )}
                    </div>
                    <div className="split-list">
                        {participatingMembers.map((member, index) => (
                            <motion.div
                                key={member.id}
                                className="split-item"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ scale: 1.02, backgroundColor: "rgba(163, 201, 168, 0.1)" }}
                            >
                                <div className="split-member">
                                    <div className="user-avatar small">
                                        <img src={member.avatar} alt={member.name} />
                                    </div>
                                    <span>{member.name}</span>
                                </div>
                                <div className={`split-input ${splitValues[member.id] ? 'valid' : ''}`}>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="0"
                                        aria-label={`Percentage for ${member.name}`}
                                        value={splitValues[member.id]}
                                        onChange={(e) => handleSplitValueChange(member.id, e.target.value)}
                                    />
                                    <span className="input-suffix" aria-hidden="true">%</span>
                                </div>
                                <span className="split-amount">
                                    {parsedAmount && splitValues[member.id]
                                        ? formatCurrency((parsedAmount * parseFloat(splitValues[member.id])) / 100)
                                        : '—'}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                    {formErrors.splitValues && (
                        <p className="form-error" role="alert">{formErrors.splitValues}</p>
                    )}
                </div>
            );
        }

        // Shares split
        if (splitType === 'shares') {
            const parsedAmount = amount ? parseFloat(amount) : 0;

            // Calculate total shares
            let totalShares = participatingMembers.reduce((sum, member) => {
                return sum + parseInt(splitValues[member.id] || 0, 10);
            }, 0);

            return (
                <div className="split-details" data-type="shares">
                    <div className="split-info">
                        <p>Enter shares for each person</p>
                        {totalShares > 0 && (
                            <div className="split-total valid">
                                Total shares: {totalShares}
                            </div>
                        )}
                    </div>
                    <div className="split-list">
                        {participatingMembers.map((member, index) => (
                            <motion.div
                                key={member.id}
                                className="split-item"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ scale: 1.02, backgroundColor: "rgba(163, 201, 168, 0.1)" }}
                            >
                                <div className="split-member">
                                    <div className="user-avatar small">
                                        <img src={member.avatar} alt={member.name} />
                                    </div>
                                    <span>{member.name}</span>
                                </div>
                                <div className={`split-input ${splitValues[member.id] ? 'valid' : ''}`}>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="0"
                                        aria-label={`Shares for ${member.name}`}
                                        value={splitValues[member.id]}
                                        onChange={(e) => handleSplitValueChange(member.id, e.target.value)}
                                    />
                                    <span className="input-suffix" aria-hidden="true">shares</span>
                                </div>
                                <span className="split-amount">
                                    {parsedAmount && totalShares > 0 && splitValues[member.id]
                                        ? formatCurrency((parsedAmount * parseInt(splitValues[member.id], 10)) / totalShares)
                                        : '—'}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                    {formErrors.splitValues && (
                        <p className="form-error" role="alert">{formErrors.splitValues}</p>
                    )}
                </div>
            );
        }

        return null;
    };

    return (
        <motion.div
            className={`group-details-page ${showSidebar ? '' : 'sidebar-collapsed'}`}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
        >
            {/* Main Content */}
            <motion.div
                className="main-content"
                variants={itemVariants}
            >
                {/* Group Header */}
                <motion.div
                    className="group-header"
                    style={{ backgroundImage: `url(${group.banner})` }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    <div className="group-header-overlay">
                        <motion.div
                            className="group-info"
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
                        >
                            <motion.div
                                className="group-avatar"
                                whileHover={{ scale: 1.05, boxShadow: "0 8px 20px rgba(0, 0, 0, 0.3)" }}
                            >
                                <motion.img
                                    src={group.avatar}
                                    alt={group.name}
                                    whileHover={{ scale: 1.1 }}
                                />
                            </motion.div>
                            <div className="group-details">
                                <motion.h1
                                    className="group-name"
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 20 }}
                                >
                                    {group.name}
                                </motion.h1>
                                <motion.p
                                    className="group-members"
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 20 }}
                                >
                                    <Users size={14} className="icon-inline" /> {group.members.length} members · Created on {new Date(group.createdAt).toLocaleDateString()}
                                </motion.p>
                            </div>
                        </motion.div>

                        <motion.div
                            className="group-quick-stats"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.4 }}
                        >
                            <div className="quick-stat">
                                <span className="quick-stat-label">Total Expenses</span>
                                <span className="quick-stat-value">{formatCurrency(totalExpenses)}</span>
                            </div>
                            <div className="quick-stat">
                                <span className="quick-stat-label">Your Balance</span>
                                <span className={`quick-stat-value ${balances.find(b => b.id === VIEWER_ID)?.balance > 0 ? 'positive' : balances.find(b => b.id === VIEWER_ID)?.balance < 0 ? 'negative' : ''}`}>
                                    {formatCurrency(balances.find(b => b.id === VIEWER_ID)?.balance || 0)}
                                </span>
                            </div>
                            <div className="quick-stat">
                                <span className="quick-stat-label">Last Activity</span>
                                <span className="quick-stat-value">
                                    {expenses.length > 0
                                        ? new Date(Math.max(...expenses.map(e => new Date(e.date)))).toLocaleDateString()
                                        : 'No activity yet'}
                                </span>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Group Actions */}
                <motion.div
                    className="group-actions"
                    variants={itemVariants}
                >
                    <motion.button
                        className="action-btn primary"
                        onClick={toggleQuickAdd}
                        whileHover={{ y: -3, boxShadow: "0 6px 20px rgba(105, 162, 151, 0.4)" }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <PlusCircle size={18} />
                        <span>Add Expense</span>
                    </motion.button>
                    <motion.button
                        className="action-btn secondary"
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <RefreshCw size={18} />
                        <span>Settle Up</span>
                    </motion.button>
                    <motion.button
                        className="action-btn tertiary"
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Share2 size={18} />
                        <span>Share Group</span>
                    </motion.button>
                    <motion.button
                        className="action-btn tertiary"
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Settings size={18} />
                        <span>Settings</span>
                    </motion.button>
                    <motion.button
                        className="action-btn tertiary"
                        onClick={() => setShowExportModal(true)}
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Upload size={18} />
                        <span>Export</span>
                    </motion.button>
                </motion.div>

                {/* Group Summary */}
                <motion.div
                    className="group-summary"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div
                        className="summary-card"
                        variants={cardVariants}
                        whileHover="hover"
                        whileTap="tap"
                    >
                        <h3 className="summary-title">TOTAL EXPENSES</h3>
                        <p className="summary-value">{formatCurrency(totalExpenses)}</p>
                        <div className="summary-trend">
                            {expenses.length > 0 && <span className="trend-text">
                                {formatCurrency(totalExpenses / expenses.length)} per expense
                            </span>}
                        </div>
                    </motion.div>
                    <motion.div
                        className="summary-card"
                        variants={cardVariants}
                        whileHover="hover"
                        whileTap="tap"
                    >
                        <h3 className="summary-title">YOUR BALANCE</h3>
                        <p className={`summary-value ${balances.find(b => b.id === VIEWER_ID)?.balance > 0 ? 'positive' : balances.find(b => b.id === VIEWER_ID)?.balance < 0 ? 'negative' : ''}`}>
                            {formatCurrency(balances.find(b => b.id === VIEWER_ID)?.balance || 0)}
                        </p>
                        <div className="summary-trend">
                            {balances.find(b => b.id === VIEWER_ID)?.balance !== 0 ? (
                                <span className="trend-text">
                                    {balances.find(b => b.id === VIEWER_ID)?.balance > 0
                                        ? 'You are owed money'
                                        : 'You owe money'}
                                </span>
                            ) : (
                                <span className="trend-text">All settled up!</span>
                            )}
                        </div>
                    </motion.div>
                    <motion.div
                        className="summary-card"
                        variants={cardVariants}
                        whileHover="hover"
                        whileTap="tap"
                    >
                        <h3 className="summary-title">YOUR EXPENSES</h3>
                        <p className="summary-value">{formatCurrency(myExpenses)}</p>
                        <div className="summary-trend">
                            <span className="trend-text">
                                {((myExpenses / totalExpenses) * 100).toFixed(1)}% of group total
                            </span>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Tabs Navigation */}
                <div className="group-tabs" role="tablist">
                    <motion.button
                        className={`tab-btn ${activeTab === 'expenses' ? 'active' : ''}`}
                        onClick={() => setActiveTab('expenses')}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        role="tab"
                        aria-selected={activeTab === 'expenses'}
                        aria-controls="expenses-tab"
                        id="expenses-tab-btn"
                    >
                        <DollarSign size={16} />
                        Expenses
                    </motion.button>
                    <motion.button
                        className={`tab-btn ${activeTab === 'balances' ? 'active' : ''}`}
                        onClick={() => setActiveTab('balances')}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        role="tab"
                        aria-selected={activeTab === 'balances'}
                        aria-controls="balances-tab"
                        id="balances-tab-btn"
                    >
                        <BarChart2 size={16} />
                        Balances
                    </motion.button>
                    <motion.button
                        className={`tab-btn ${activeTab === 'totals' ? 'active' : ''}`}
                        onClick={() => setActiveTab('totals')}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        role="tab"
                        aria-selected={activeTab === 'totals'}
                        aria-controls="totals-tab"
                        id="totals-tab-btn"
                    >
                        <PieChart size={16} />
                        Analysis
                    </motion.button>
                    <motion.button
                        className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`}
                        onClick={() => setActiveTab('members')}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        role="tab"
                        aria-selected={activeTab === 'members'}
                        aria-controls="members-tab"
                        id="members-tab-btn"
                    >
                        <Users size={16} />
                        Members
                    </motion.button>
                    <motion.button
                        className={`tab-btn ${activeTab === 'whiteboard' ? 'active' : ''}`}
                        onClick={() => setActiveTab('whiteboard')}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        role="tab"
                        aria-selected={activeTab === 'whiteboard'}
                        aria-controls="whiteboard-tab"
                        id="whiteboard-tab-btn"
                    >
                        <PenSquare size={16} />
                        Notes
                    </motion.button>
                </div>

                {/* Filter Controls */}
                {activeTab === 'expenses' && (
                    <motion.div
                        className="filter-controls"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="filter-group">
                            <label>View</label>
                            <div className="filter-options">
                                <button
                                    className={`filter-option ${expenseFilter === 'all' ? 'active' : ''}`}
                                    onClick={() => setExpenseFilter('all')}
                                >
                                    All Expenses
                                </button>
                                <button
                                    className={`filter-option ${expenseFilter === 'you_paid' ? 'active' : ''}`}
                                    onClick={() => setExpenseFilter('you_paid')}
                                >
                                    You Paid
                                </button>
                                <button
                                    className={`filter-option ${expenseFilter === 'you_involved' ? 'active' : ''}`}
                                    onClick={() => setExpenseFilter('you_involved')}
                                >
                                    Involving You
                                </button>
                            </div>
                        </div>

                        <div className="filter-group">
                            <label>Time</label>
                            <div className="filter-options">
                                <button
                                    className={`filter-option ${timePeriod === 'all' ? 'active' : ''}`}
                                    onClick={() => setTimePeriod('all')}
                                >
                                    All Time
                                </button>
                                <button
                                    className={`filter-option ${timePeriod === 'this_month' ? 'active' : ''}`}
                                    onClick={() => setTimePeriod('this_month')}
                                >
                                    This Month
                                </button>
                                <button
                                    className={`filter-option ${timePeriod === 'last_month' ? 'active' : ''}`}
                                    onClick={() => setTimePeriod('last_month')}
                                >
                                    Last Month
                                </button>
                                <button
                                    className={`filter-option ${timePeriod === 'this_year' ? 'active' : ''}`}
                                    onClick={() => setTimePeriod('this_year')}
                                >
                                    This Year
                                </button>
                            </div>
                        </div>

                        <div className="filter-group">
                            <label>Sort</label>
                            <div className="filter-options">
                                <button
                                    className={`filter-option ${sortBy === 'date_desc' ? 'active' : ''}`}
                                    onClick={() => setSortBy('date_desc')}
                                >
                                    Newest First
                                </button>
                                <button
                                    className={`filter-option ${sortBy === 'date_asc' ? 'active' : ''}`}
                                    onClick={() => setSortBy('date_asc')}
                                >
                                    Oldest First
                                </button>
                                <button
                                    className={`filter-option ${sortBy === 'amount_desc' ? 'active' : ''}`}
                                    onClick={() => setSortBy('amount_desc')}
                                >
                                    Highest Amount
                                </button>
                                <button
                                    className={`filter-option ${sortBy === 'amount_asc' ? 'active' : ''}`}
                                    onClick={() => setSortBy('amount_asc')}
                                >
                                    Lowest Amount
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Tab Content */}
                <div className="tab-content">
                    {/* Expenses Tab */}
                    {activeTab === 'expenses' && (
                        <div
                            className="expenses-list"
                            role="tabpanel"
                            id="expenses-tab"
                            aria-labelledby="expenses-tab-btn"
                        >
                            <AnimatePresence>
                                {filteredExpenses && filteredExpenses.length > 0 ? (
                                    <motion.div
                                        variants={containerVariants}
                                        initial="hidden"
                                        animate="visible"
                                        className="expense-cards"
                                    >
                                        {filteredExpenses.map((expense, index) => (
                                            <motion.div
                                                layout
                                                key={expense.id || index}
                                                className={`expense-card ${expense.isSettlement ? 'settlement' : ''} ${expense.paidBy.id === VIEWER_ID ? 'you-paid' : ''}`}
                                                variants={cardVariants}
                                                initial="hidden"
                                                animate="visible"
                                                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                                                transition={{ delay: index * 0.05 }}
                                                whileHover={{ y: -5, boxShadow: "0 12px 30px rgba(0, 0, 0, 0.1)" }}
                                                onHoverStart={() => setHoveredExpense(expense.id)}
                                                onHoverEnd={() => setHoveredExpense(null)}
                                            >
                                                <div className="expense-date-badge">
                                                    <span className="date-month">{new Date(expense.date).toLocaleString('default', { month: 'short' })}</span>
                                                    <span className="date-day">{new Date(expense.date).getDate()}</span>
                                                </div>

                                                <div className="expense-content">
                                                    <div className="expense-header">
                                                        <div className="expense-category-icon">
                                                            <span role="img" aria-label={expense.category.name}>{expense.category.icon}</span>
                                                        </div>

                                                        <div className="expense-title-section">
                                                            <h3 className="expense-title">{expense.description}</h3>
                                                            <p className="expense-meta">
                                                                <span className="expense-group">{group.name}</span>
                                                                <span className="expense-time">{new Date(expense.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            </p>
                                                        </div>

                                                        <div className="expense-amount-section">
                                                            <span className="expense-amount">{formatCurrency(expense.amount)}</span>
                                                            <p className="expense-payer">
                                                                {expense.paidBy.id === VIEWER_ID ? (
                                                                    <span>You paid</span>
                                                                ) : (
                                                                    <span>{expense.paidBy.name} paid</span>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="expense-details">
                                                        <div className="expense-participants">
                                                            <div className="participant-avatars">
                                                                {expense.participants.slice(0, 3).map(participant => (
                                                                    <div key={participant.id} className="participant-avatar">
                                                                        <img src={participant.avatar} alt={participant.name} />
                                                                    </div>
                                                                ))}
                                                                {expense.participants.length > 3 && (
                                                                    <div className="participant-avatar more">
                                                                        +{expense.participants.length - 3}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <p className="participants-summary">
                                                                Split {expense.isSettlement ? 'between' : 'equally between'} {expense.participants.length} {expense.participants.length === 1 ? 'person' : 'people'}
                                                            </p>
                                                        </div>

                                                        <div className="expense-balance">
                                                            {expense.paidBy.id === VIEWER_ID ? (
                                                                <div className="balance-item positive">
                                                                    <ArrowDownLeft size={14} />
                                                                    <span>You get back {formatCurrency(expense.amount - (expense.amount / expense.participants.length))}</span>
                                                                </div>
                                                            ) : expense.participants.some(p => p.id === VIEWER_ID) ? (
                                                                <div className="balance-item negative">
                                                                    <ArrowUpRight size={14} />
                                                                    <span>You owe {formatCurrency(expense.amount / expense.participants.length)}</span>
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </div>

                                                    <AnimatePresence>
                                                        {hoveredExpense === expense.id && (
                                                            <motion.div
                                                                className="expense-actions"
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: 10 }}
                                                                transition={{ duration: 0.2 }}
                                                            >
                                                                <motion.button
                                                                    className="expense-action-btn"
                                                                    whileHover={{ scale: 1.1 }}
                                                                    whileTap={{ scale: 0.9 }}
                                                                    title="Edit expense"
                                                                >
                                                                    <Edit2 size={14} />
                                                                </motion.button>
                                                                <motion.button
                                                                    className="expense-action-btn"
                                                                    whileHover={{ scale: 1.1 }}
                                                                    whileTap={{ scale: 0.9 }}
                                                                    title="Delete expense"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </motion.button>
                                                                {expense.paidBy.id !== VIEWER_ID && expense.participants.some(p => p.id === VIEWER_ID) && (
                                                                    <motion.button
                                                                        className="expense-action-btn primary"
                                                                        whileHover={{ scale: 1.1 }}
                                                                        whileTap={{ scale: 0.9 }}
                                                                        title="Settle this expense"
                                                                    >
                                                                        <RefreshCw size={14} />
                                                                    </motion.button>
                                                                )}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        className="empty-state"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <div className="empty-illustration" aria-hidden="true">💸</div>
                                        <h3>No expenses yet</h3>
                                        <p>Add your first expense to get started</p>
                                        <motion.button
                                            className="action-btn primary"
                                            onClick={toggleQuickAdd}
                                            whileHover={{ y: -3, boxShadow: "0 6px 20px rgba(105, 162, 151, 0.4)" }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <PlusCircle size={18} />
                                            Add an Expense
                                        </motion.button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Balances Tab */}
                    {activeTab === 'balances' && (
                        <div
                            className="balances-container"
                            role="tabpanel"
                            id="balances-tab"
                            aria-labelledby="balances-tab-btn"
                        >
                            <motion.div
                                className="balance-summary"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <h3 className="section-title">Overall Balance</h3>
                                <div className="balance-cards">
                                    <div className="balance-overview-card">
                                        <div className="balance-header">
                                            <h4>Total Balance</h4>
                                            <span className={`balance-value ${balances.find(b => b.id === VIEWER_ID)?.balance > 0 ? 'positive' : balances.find(b => b.id === VIEWER_ID)?.balance < 0 ? 'negative' : ''}`}>
                                                {formatCurrency(balances.find(b => b.id === VIEWER_ID)?.balance || 0)}
                                            </span>
                                        </div>
                                        <div className="balance-details">
                                            <div className="balance-detail-item">
                                                <ArrowDownLeft size={16} className="icon-green" />
                                                <span>You are owed: {formatCurrency(balances.filter(b => b.balance < 0).reduce((sum, b) => sum + Math.abs(b.balance), 0))}</span>
                                            </div>
                                            <div className="balance-detail-item">
                                                <ArrowUpRight size={16} className="icon-red" />
                                                <span>You owe: {formatCurrency(balances.filter(b => b.balance > 0).reduce((sum, b) => sum + b.balance, 0))}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                className="balances-list"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                <h3 className="section-title">Member Balances</h3>
                                <div className="balance-cards">
                                    {balances.filter(balance => balance.id !== VIEWER_ID).map((balance, index) => (
                                        <motion.div
                                            key={balance.id}
                                            className={`balance-card ${balance.balance < 0 ? 'you-are-owed' : balance.balance > 0 ? 'you-owe' : 'settled'}`}
                                            variants={cardVariants}
                                            whileHover="hover"
                                            whileTap="tap"
                                        >
                                            <div className="balance-card-avatar">
                                                <img src={balance.avatar} alt={balance.name} />
                                            </div>
                                            <div className="balance-card-info">
                                                <h4 className="balance-name">{balance.name}</h4>
                                                {balance.balance !== 0 ? (
                                                    <p className={`balance-status ${balance.balance < 0 ? 'positive' : 'negative'}`}>
                                                        {balance.balance < 0 ? (
                                                            <>
                                                                <ArrowDownLeft size={14} />
                                                                <span>owes you {formatCurrency(Math.abs(balance.balance))}</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ArrowUpRight size={14} />
                                                                <span>you owe {formatCurrency(balance.balance)}</span>
                                                            </>
                                                        )}
                                                    </p>
                                                ) : (
                                                    <p className="balance-status settled">
                                                        <Check size={14} />
                                                        <span>all settled up</span>
                                                    </p>
                                                )}
                                            </div>
                                            {balance.balance !== 0 && (
                                                <motion.button
                                                    className="settle-up-btn"
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleSettleUp(balance.id)}
                                                >
                                                    Settle Up
                                                </motion.button>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>

                            <motion.div
                                className="simplify-debts"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <h3 className="section-title">Simplified Balances</h3>
                                <p className="section-subtitle">The most efficient way to settle all debts</p>
                                <div className="simplified-transactions">
                                    {balances.filter(b => b.balance < 0).map((debtor, index) => {
                                        // Find a creditor (someone with positive balance)
                                        const creditor = balances.find(b => b.balance > 0);

                                        if (!creditor) return null;

                                        return (
                                            <motion.div
                                                key={`simplified-${debtor.id}`}
                                                className="simplified-transaction"
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.5 + (index * 0.1) }}
                                                whileHover={{ scale: 1.02, backgroundColor: "rgba(105, 162, 151, 0.1)" }}
                                            >
                                                <div className="transaction-users">
                                                    <div className="user-avatar small">
                                                        <img src={debtor.avatar} alt={debtor.name} />
                                                    </div>
                                                    <span className="transaction-arrow" aria-hidden="true">→</span>
                                                    <div className="user-avatar small">
                                                        <img src={creditor.avatar} alt={creditor.name} />
                                                    </div>
                                                </div>
                                                <div className="transaction-names">
                                                    <span className="name-from">{debtor.name}</span>
                                                    <span className="name-to">{creditor.name}</span>
                                                </div>
                                                <p className="transaction-amount">
                                                    {formatCurrency(Math.abs(debtor.balance))}
                                                </p>
                                                <motion.button
                                                    className="record-payment-btn"
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    Record
                                                </motion.button>
                                            </motion.div>
                                        );
                                    })}

                                    {balances.filter(b => b.balance < 0).length === 0 && (
                                        <div className="all-settled-message">
                                            <motion.div
                                                className="settled-icon"
                                                animate={{
                                                    scale: [1, 1.2, 1],
                                                    rotate: [0, 10, -10, 0]
                                                }}
                                                transition={{
                                                    duration: 1,
                                                    repeat: Infinity,
                                                    repeatDelay: 2
                                                }}
                                            >
                                                🎉
                                            </motion.div>
                                            <p>All balances are settled!</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {activeTab === 'totals' && (
                        <div
                            className="totals-container"
                            role="tabpanel"
                            id="totals-tab"
                            aria-labelledby="totals-tab-btn"
                        >
                            {/* Dashboard Summary Cards */}
                            <motion.div
                                className="analysis-summary-cards"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <div className="summary-cards-grid">
                                    <motion.div
                                        className="analysis-summary-card"
                                        whileHover={{ y: -5, boxShadow: "0 12px 30px rgba(0, 0, 0, 0.1)" }}
                                    >
                                        <div className="summary-card-icon">
                                            <DollarSign size={24} />
                                        </div>
                                        <div className="summary-card-content">
                                            <h4>Total Spent</h4>
                                            <p className="summary-card-value">{formatCurrency(totalExpenses)}</p>
                                            <p className="summary-card-trend">
                                                {monthlyTotals.length > 1 &&
                                                    `${monthlyTotals[monthlyTotals.length - 1].total > monthlyTotals[monthlyTotals.length - 2].total
                                                        ? '↑' : '↓'} ${((Math.abs(monthlyTotals[monthlyTotals.length - 1].total - monthlyTotals[monthlyTotals.length - 2].total) /
                                                            monthlyTotals[monthlyTotals.length - 2].total) * 100).toFixed(1)}% from last month`
                                                }
                                            </p>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        className="analysis-summary-card"
                                        whileHover={{ y: -5, boxShadow: "0 12px 30px rgba(0, 0, 0, 0.1)" }}
                                    >
                                        <div className="summary-card-icon">
                                            <BarChart2 size={24} />
                                        </div>
                                        <div className="summary-card-content">
                                            <h4>Average per Expense</h4>
                                            <p className="summary-card-value">{formatCurrency(expenses.length > 0 ? totalExpenses / expenses.length : 0)}</p>
                                            <p className="summary-card-trend">{expenses.length} total expenses</p>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        className="analysis-summary-card"
                                        whileHover={{ y: -5, boxShadow: "0 12px 30px rgba(0, 0, 0, 0.1)" }}
                                    >
                                        <div className="summary-card-icon">
                                            <PieChart size={24} />
                                        </div>
                                        <div className="summary-card-content">
                                            <h4>Top Category</h4>
                                            <p className="summary-card-value">
                                                {categoryTotals.length > 0 ?
                                                    `${categoryTotals[0].icon} ${categoryTotals[0].name}` :
                                                    'No data'}
                                            </p>
                                            <p className="summary-card-trend">
                                                {categoryTotals.length > 0 ?
                                                    `${((categoryTotals[0].total / totalExpenses) * 100).toFixed(1)}% of total` :
                                                    ''}
                                            </p>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        className="analysis-summary-card"
                                        whileHover={{ y: -5, boxShadow: "0 12px 30px rgba(0, 0, 0, 0.1)" }}
                                    >
                                        <div className="summary-card-icon">
                                            <User size={24} />
                                        </div>
                                        <div className="summary-card-content">
                                            <h4>Top Contributor</h4>
                                            {group.members.length > 0 ? (
                                                <>
                                                    <p className="summary-card-value with-avatar">
                                                        <span className="mini-avatar">
                                                            <img
                                                                src={group.members.sort((a, b) => {
                                                                    const aTotal = expenses.filter(e => e.paidBy.id === a.id).reduce((sum, e) => sum + e.amount, 0);
                                                                    const bTotal = expenses.filter(e => e.paidBy.id === b.id).reduce((sum, e) => sum + e.amount, 0);
                                                                    return bTotal - aTotal;
                                                                })[0]?.avatar}
                                                                alt=""
                                                            />
                                                        </span>
                                                        {group.members.sort((a, b) => {
                                                            const aTotal = expenses.filter(e => e.paidBy.id === a.id).reduce((sum, e) => sum + e.amount, 0);
                                                            const bTotal = expenses.filter(e => e.paidBy.id === b.id).reduce((sum, e) => sum + e.amount, 0);
                                                            return bTotal - aTotal;
                                                        })[0]?.name}
                                                    </p>
                                                    <p className="summary-card-trend">
                                                        {formatCurrency(
                                                            expenses.filter(e => e.paidBy.id === group.members.sort((a, b) => {
                                                                const aTotal = expenses.filter(e => e.paidBy.id === a.id).reduce((sum, e) => sum + e.amount, 0);
                                                                const bTotal = expenses.filter(e => e.paidBy.id === b.id).reduce((sum, e) => sum + e.amount, 0);
                                                                return bTotal - aTotal;
                                                            })[0]?.id).reduce((sum, e) => sum + e.amount, 0)
                                                        )}
                                                    </p>
                                                </>
                                            ) : (
                                                <p className="summary-card-value">No data</p>
                                            )}
                                        </div>
                                    </motion.div>
                                </div>
                            </motion.div>

                            {/* Expense Trend Over Time - Line Chart */}
                            <motion.div
                                className="analysis-card expense-trend-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <div className="analysis-card-header">
                                    <h3 className="section-title">
                                        <motion.span
                                            className="title-icon-wrapper"
                                            initial={{ rotate: -45, scale: 0.5 }}
                                            animate={{ rotate: 0, scale: 1 }}
                                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                        >
                                            <BarChart2 size={18} />
                                        </motion.span>
                                        Expense Trend
                                    </h3>
                                    <p className="section-subtitle">How your expenses have changed over time</p>
                                </div>

                                <div className="analysis-card-content">
                                    {monthlyTotals.length > 0 ? (
                                        <div className="chart-container">
                                            <ResponsiveContainer width="100%" height={300}>
                                                <ComposedChart
                                                    data={monthlyTotals}
                                                    margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                                                >
                                                    <defs>
                                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#69a297" stopOpacity={0.8} />
                                                            <stop offset="95%" stopColor="#69a297" stopOpacity={0.1} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                    <XAxis
                                                        dataKey="month"
                                                        tickMargin={10}
                                                        axisLine={{ stroke: '#e0e0e0' }}
                                                        tick={{ fill: '#666', fontSize: 12 }}
                                                    />
                                                    <YAxis
                                                        tickFormatter={(value) => formatCurrency(value).split('.')[0]}
                                                        axisLine={{ stroke: '#e0e0e0' }}
                                                        tick={{ fill: '#666', fontSize: 12 }}
                                                    />
                                                    <Tooltip
                                                        formatter={(value) => [formatCurrency(value), "Amount"]}
                                                        labelFormatter={(label) => `${label} ${monthlyTotals.find(m => m.month === label)?.year}`}
                                                        contentStyle={{
                                                            backgroundColor: '#fff',
                                                            border: 'none',
                                                            borderRadius: '10px',
                                                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                                                            padding: '10px 14px'
                                                        }}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="total"
                                                        fill="url(#colorTotal)"
                                                        stroke="#69a297"
                                                        strokeWidth={3}
                                                        dot={{ stroke: '#69a297', strokeWidth: 2, r: 4, fill: '#fff' }}
                                                        activeDot={{ stroke: '#69a297', strokeWidth: 2, r: 6, fill: '#fff' }}
                                                    />
                                                    <Bar
                                                        dataKey="total"
                                                        barSize={20}
                                                        fill="#a3c9a8"
                                                        radius={[4, 4, 0, 0]}
                                                        fillOpacity={0.6}
                                                    />
                                                </ComposedChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <div className="empty-chart-message">
                                            <p>Add some expenses to see your spending trends</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Spending by Category - Interactive Pie Chart */}
                            <div className="analysis-grid">
                                <motion.div
                                    className="analysis-card category-breakdown-card"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <div className="analysis-card-header">
                                        <h3 className="section-title">
                                            <motion.span
                                                className="title-icon-wrapper"
                                                initial={{ rotate: -45, scale: 0.5 }}
                                                animate={{ rotate: 0, scale: 1 }}
                                                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                                            >
                                                <PieChart size={18} />
                                            </motion.span>
                                            Spending by Category
                                        </h3>
                                        <p className="section-subtitle">Where your money is going</p>
                                    </div>

                                    <div className="analysis-card-content">
                                        {categoryTotals.length > 0 ? (
                                            <div className="chart-container">
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <PieChart>
                                                        <Pie
                                                            data={categoryTotals}
                                                            cx="50%"
                                                            cy="50%"
                                                            labelLine={false}
                                                            outerRadius={120}
                                                            innerRadius={60}
                                                            dataKey="total"
                                                            nameKey="name"
                                                            paddingAngle={2}
                                                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                                                        >
                                                            {categoryTotals.map((entry, index) => (
                                                                <Cell
                                                                    key={`cell-${index}`}
                                                                    fill={`hsl(${160 - index * 12}, ${60 - index * 2}%, ${60 - index * 1.5}%)`}
                                                                />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip
                                                            formatter={(value) => [formatCurrency(value), "Amount"]}
                                                            contentStyle={{
                                                                backgroundColor: '#fff',
                                                                border: 'none',
                                                                borderRadius: '10px',
                                                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                                                                padding: '10px 14px'
                                                            }}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        ) : (
                                            <div className="empty-chart-message">
                                                <p>Add some expenses to see category breakdown</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>

                                {/* Member Contribution - Bar Chart */}
                                <motion.div
                                    className="analysis-card member-contribution-card"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    <div className="analysis-card-header">
                                        <h3 className="section-title">
                                            <motion.span
                                                className="title-icon-wrapper"
                                                initial={{ rotate: -45, scale: 0.5 }}
                                                animate={{ rotate: 0, scale: 1 }}
                                                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                                            >
                                                <Users size={18} />
                                            </motion.span>
                                            Member Contribution
                                        </h3>
                                        <p className="section-subtitle">Who's paying what</p>
                                    </div>

                                    <div className="analysis-card-content">
                                        {group.members.length > 0 ? (
                                            <div className="chart-container">
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <BarChart
                                                        data={group.members.map(member => {
                                                            const memberExpenses = expenses.filter(e => e.paidBy.id === member.id);
                                                            const memberTotal = memberExpenses.reduce((sum, e) => sum + e.amount, 0);
                                                            return {
                                                                id: member.id,
                                                                name: member.name,
                                                                avatar: member.avatar,
                                                                total: memberTotal,
                                                                percentage: totalExpenses > 0 ? (memberTotal / totalExpenses) * 100 : 0
                                                            };
                                                        }).sort((a, b) => b.total - a.total)}
                                                        layout="vertical"
                                                        margin={{ top: 10, right: 30, left: 70, bottom: 10 }}
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                                                        <XAxis
                                                            type="number"
                                                            tickFormatter={(value) => formatCurrency(value).split('.')[0]}
                                                            axisLine={{ stroke: '#e0e0e0' }}
                                                            tick={{ fill: '#666', fontSize: 12 }}
                                                        />
                                                        <YAxis
                                                            type="category"
                                                            dataKey="name"
                                                            axisLine={{ stroke: '#e0e0e0' }}
                                                            tick={{ fill: '#666', fontSize: 12 }}
                                                            tickLine={false}
                                                            width={60}
                                                        />
                                                        <Tooltip
                                                            formatter={(value) => [formatCurrency(value), "Amount"]}
                                                            contentStyle={{
                                                                backgroundColor: '#fff',
                                                                border: 'none',
                                                                borderRadius: '10px',
                                                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                                                                padding: '10px 14px'
                                                            }}
                                                        />
                                                        <Bar
                                                            dataKey="total"
                                                            fill="#84b59f"
                                                            radius={[0, 4, 4, 0]}
                                                        >
                                                            <LabelList
                                                                dataKey="percentage"
                                                                position="right"
                                                                formatter={(value) => `${value.toFixed(1)}%`}
                                                                style={{ fill: '#666', fontSize: 12 }}
                                                            />
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        ) : (
                                            <div className="empty-chart-message">
                                                <p>Add some members to see contribution breakdown</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </div>

                            {/* Enhanced Insights Cards */}
                            <motion.div
                                className="analysis-insights"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                            >
                                <h3 className="section-title">
                                    <motion.span
                                        className="title-icon-wrapper"
                                        initial={{ rotate: -45, scale: 0.5 }}
                                        animate={{ rotate: 0, scale: 1 }}
                                        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                                    >
                                        <Info size={18} />
                                    </motion.span>
                                    Expense Insights
                                </h3>

                                <div className="insights-grid">
                                    {expenses.length > 0 && (
                                        <>
                                            <motion.div
                                                className="insight-card"
                                                whileHover={{ y: -5, boxShadow: "0 12px 30px rgba(0, 0, 0, 0.1)" }}
                                            >
                                                <div className="insight-icon">
                                                    <ArrowUpRight size={20} />
                                                </div>
                                                <div className="insight-content">
                                                    <h4>Largest Expense</h4>
                                                    <p className="insight-value">{formatCurrency(Math.max(...expenses.map(e => e.amount)))}</p>
                                                    <p className="insight-detail">
                                                        {expenses.sort((a, b) => b.amount - a.amount)[0]?.description} on {new Date(expenses.sort((a, b) => b.amount - a.amount)[0]?.date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </motion.div>

                                            <motion.div
                                                className="insight-card"
                                                whileHover={{ y: -5, boxShadow: "0 12px 30px rgba(0, 0, 0, 0.1)" }}
                                            >
                                                <div className="insight-icon">
                                                    <Clock size={20} />
                                                </div>
                                                <div className="insight-content">
                                                    <h4>Most Active Day</h4>
                                                    {(() => {
                                                        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                                                        const expensesByDay = {};

                                                        expenses.forEach(expense => {
                                                            const date = new Date(expense.date);
                                                            const day = daysOfWeek[date.getDay()];

                                                            if (!expensesByDay[day]) {
                                                                expensesByDay[day] = { count: 0, total: 0 };
                                                            }

                                                            expensesByDay[day].count += 1;
                                                            expensesByDay[day].total += expense.amount;
                                                        });

                                                        const mostActiveDay = Object.entries(expensesByDay)
                                                            .sort((a, b) => b[1].count - a[1].count)[0];

                                                        return (
                                                            <>
                                                                <p className="insight-value">{mostActiveDay?.[0]}</p>
                                                                <p className="insight-detail">
                                                                    {mostActiveDay?.[1].count} expenses totaling {formatCurrency(mostActiveDay?.[1].total)}
                                                                </p>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </motion.div>

                                            <motion.div
                                                className="insight-card"
                                                whileHover={{ y: -5, boxShadow: "0 12px 30px rgba(0, 0, 0, 0.1)" }}
                                            >
                                                <div className="insight-icon">
                                                    <Tag size={20} />
                                                </div>
                                                <div className="insight-content">
                                                    <h4>Most Frequent Category</h4>
                                                    {(() => {
                                                        const categoryCounts = {};

                                                        expenses.forEach(expense => {
                                                            const categoryId = expense.category.id;

                                                            if (!categoryCounts[categoryId]) {
                                                                categoryCounts[categoryId] = {
                                                                    count: 0,
                                                                    name: expense.category.name,
                                                                    icon: expense.category.icon
                                                                };
                                                            }

                                                            categoryCounts[categoryId].count += 1;
                                                        });

                                                        const mostFrequentCategory = Object.values(categoryCounts)
                                                            .sort((a, b) => b.count - a.count)[0];

                                                        return (
                                                            <>
                                                                <p className="insight-value">
                                                                    {mostFrequentCategory?.icon} {mostFrequentCategory?.name}
                                                                </p>
                                                                <p className="insight-detail">
                                                                    Used in {mostFrequentCategory?.count} out of {expenses.length} expenses
                                                                </p>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </motion.div>

                                            <motion.div
                                                className="insight-card"
                                                whileHover={{ y: -5, boxShadow: "0 12px 30px rgba(0, 0, 0, 0.1)" }}
                                            >
                                                <div className="insight-icon">
                                                    <Calendar size={20} />
                                                </div>
                                                <div className="insight-content">
                                                    <h4>Spending Pace</h4>
                                                    {(() => {
                                                        if (expenses.length < 2) return <p className="insight-value">Need more data</p>;

                                                        const oldestExpense = new Date(Math.min(...expenses.map(e => new Date(e.date))));
                                                        const daysSinceStart = Math.max(1, Math.ceil((new Date() - oldestExpense) / (1000 * 60 * 60 * 24)));
                                                        const dailyAverage = totalExpenses / daysSinceStart;
                                                        const monthlyProjection = dailyAverage * 30;

                                                        return (
                                                            <>
                                                                <p className="insight-value">{formatCurrency(dailyAverage)} / day</p>
                                                                <p className="insight-detail">
                                                                    Projected {formatCurrency(monthlyProjection)} this month
                                                                </p>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </motion.div>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {/* Members Tab */}
                    {activeTab === 'members' && (
                        <div
                            className="members-container"
                            role="tabpanel"
                            id="members-tab"
                            aria-labelledby="members-tab-btn"
                        >
                            <motion.div
                                className="members-header"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <h3 className="section-title">Group Members ({group.members.length})</h3>
                                <motion.button
                                    className="add-member-btn"
                                    whileHover={{ y: -3, boxShadow: "0 6px 20px rgba(105, 162, 151, 0.4)" }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <PlusCircle size={16} />
                                    <span>Add Member</span>
                                </motion.button>
                            </motion.div>

                            <motion.div
                                className="members-list"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                {group.members.map((member, index) => (
                                    <motion.div
                                        key={member.id}
                                        className="member-card"
                                        variants={cardVariants}
                                        custom={index}
                                        whileHover="hover"
                                        whileTap="tap"
                                    >
                                        <div className="member-avatar">
                                            <img src={member.avatar} alt={member.name} />
                                        </div>
                                        <div className="member-info">
                                            <h4 className="member-name">{member.name} {member.id === VIEWER_ID && <span className="member-you-badge">You</span>}</h4>
                                            <p className="member-email">{member.email}</p>

                                            <div className="member-stats">
                                                <div className="member-stat">
                                                    <div className="stat-label">
                                                        <DollarSign size={14} />
                                                        <span>Paid</span>
                                                    </div>
                                                    <div className="stat-value">
                                                        {formatCurrency(expenses.filter(e => e.paidBy.id === member.id).reduce((sum, e) => sum + e.amount, 0))}
                                                    </div>
                                                </div>

                                                <div className="member-stat">
                                                    <div className="stat-label">
                                                        <Calendar size={14} />
                                                        <span>Joined</span>
                                                    </div>
                                                    <div className="stat-value">
                                                        {new Date(group.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="member-actions">
                                            {member.id !== VIEWER_ID && (
                                                <>
                                                    <motion.button
                                                        className="member-action-btn primary"
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleSettleUp(member.id)}
                                                    >
                                                        Settle
                                                    </motion.button>
                                                    <motion.button
                                                        className="member-action-btn danger"
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleRemoveMember(member.id)}
                                                    >
                                                        <Trash2 size={16} />
                                                    </motion.button>
                                                </>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>

                            <motion.div
                                className="invite-member-section"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                            >
                                <h3 className="section-title">Invite New Members</h3>
                                <div className="invite-methods">
                                    <motion.div
                                        className="invite-method-card"
                                        whileHover={{ y: -5, boxShadow: "0 12px 30px rgba(0, 0, 0, 0.1)" }}
                                    >
                                        <div className="invite-method-icon">
                                            <Share2 size={24} />
                                        </div>
                                        <h4>Share Link</h4>
                                        <p>Send a link that allows anyone to join this group</p>
                                        <motion.button
                                            className="invite-btn"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            Create Link
                                        </motion.button>
                                    </motion.div>

                                    <motion.div
                                        className="invite-method-card"
                                        whileHover={{ y: -5, boxShadow: "0 12px 30px rgba(0, 0, 0, 0.1)" }}
                                    >
                                        <div className="invite-method-icon">
                                            <User size={24} />
                                        </div>
                                        <h4>Add Directly</h4>
                                        <p>Add members from your existing contacts</p>
                                        <motion.button
                                            className="invite-btn"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            Add Contact
                                        </motion.button>
                                    </motion.div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                    {/* Whiteboard Tab */}
                    {activeTab === 'whiteboard' && (
                        <div
                            className="whiteboard-container"
                            role="tabpanel"
                            id="whiteboard-tab"
                            aria-labelledby="whiteboard-tab-btn"
                        >
                            <Whiteboard
                                groupId={group.id}
                                onSave={(dataUrl, filename) => {
                                    // In a real app, you might want to save this to your backend
                                    console.log('Whiteboard saved:', filename);
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Enhanced Quick Add Expense Modal with modern styling and animations */}
                <AnimatePresence>
                    {isQuickAddOpen && (
                        <motion.div
                            className="modal-overlay glass-effect"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={(e) => {
                                if (e.target === e.currentTarget) {
                                    toggleQuickAdd();
                                }
                            }}
                        >
                            <motion.div
                                className="modal-content quick-add-modal modern"
                                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                    scale: 1,
                                    transition: {
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 25
                                    }
                                }}
                                exit={{
                                    opacity: 0,
                                    y: 50,
                                    scale: 0.95,
                                    transition: { duration: 0.2 }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                role="dialog"
                                aria-labelledby="expense-modal-title"
                                aria-modal="true"
                            >
                                <div className="modal-header modern-header">
                                    <motion.h2
                                        id="expense-modal-title"
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.1 }}
                                    >
                                        <motion.span
                                            className="modal-title-icon-wrapper"
                                            initial={{ rotate: -45, scale: 0.5 }}
                                            animate={{ rotate: 0, scale: 1 }}
                                            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                                        >
                                            <PlusCircle size={22} className="modal-title-icon" />
                                        </motion.span>
                                        Add an expense
                                    </motion.h2>
                                    <motion.button
                                        className="close-modal-btn modern-close"
                                        onClick={toggleQuickAdd}
                                        whileHover={{
                                            rotate: 90,
                                            backgroundColor: "rgba(0, 0, 0, 0.1)",
                                            scale: 1.1
                                        }}
                                        whileTap={{ scale: 0.9 }}
                                        aria-label="Close modal"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <X size={18} />
                                    </motion.button>
                                </div>

                                <motion.div
                                    className="modal-body modern-body"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <div className="expense-form modern-form">
                                        <motion.div
                                            className={`form-group modern-input ${formErrors.description ? 'has-error' : ''}`}
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.3 }}
                                        >
                                            <label htmlFor="description">
                                                <motion.span whileHover={{ scale: 1.05 }}>Description</motion.span>
                                            </label>
                                            <input
                                                type="text"
                                                id="description"
                                                name="description"
                                                placeholder="What was this expense for?"
                                                value={expenseForm.description}
                                                onChange={handleExpenseFormChange}
                                                aria-invalid={formErrors.description ? "true" : "false"}
                                                aria-describedby={formErrors.description ? "description-error" : undefined}
                                                className="modern-text-input"
                                            />
                                            {formErrors.description && (
                                                <motion.p
                                                    className="form-error"
                                                    id="description-error"
                                                    role="alert"
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                >
                                                    {formErrors.description}
                                                </motion.p>
                                            )}
                                        </motion.div>

                                        <div className="form-row">
                                            <motion.div
                                                className={`form-group modern-input ${formErrors.amount ? 'has-error' : ''}`}
                                                initial={{ y: 20, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                transition={{ delay: 0.4 }}
                                            >
                                                <label htmlFor="amount">
                                                    <motion.span whileHover={{ scale: 1.05 }}>Amount</motion.span>
                                                </label>
                                                <div className="amount-input modern-amount">
                                                    <span className="currency-symbol" aria-hidden="true">
                                                        {group.currency === 'INR' ? '₹' : '$'}
                                                    </span>
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        id="amount"
                                                        name="amount"
                                                        placeholder="0.00"
                                                        value={expenseForm.amount}
                                                        onChange={handleAmountChange}
                                                        aria-invalid={formErrors.amount ? "true" : "false"}
                                                        aria-describedby={formErrors.amount ? "amount-error" : undefined}
                                                        className="modern-text-input"
                                                    />
                                                </div>
                                                {formErrors.amount && (
                                                    <motion.p
                                                        className="form-error"
                                                        id="amount-error"
                                                        role="alert"
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                    >
                                                        {formErrors.amount}
                                                    </motion.p>
                                                )}
                                            </motion.div>

                                            <motion.div
                                                className="form-group modern-input"
                                                initial={{ y: 20, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                transition={{ delay: 0.5 }}
                                            >
                                                <label htmlFor="paidBy">
                                                    <motion.span whileHover={{ scale: 1.05 }}>Paid by</motion.span>
                                                </label>
                                                <div className="select-wrapper">
                                                    <select
                                                        id="paidBy"
                                                        name="paidBy"
                                                        value={expenseForm.paidBy}
                                                        onChange={handleExpenseFormChange}
                                                        aria-invalid={formErrors.paidBy ? "true" : "false"}
                                                        className="modern-select"
                                                    >
                                                        <option value="you">You</option>
                                                        {group.members.filter(m => m.id !== VIEWER_ID).map(member => (
                                                            <option key={member.id} value={member.id}>{member.name}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown size={16} className="select-arrow" />
                                                </div>
                                            </motion.div>
                                        </div>

                                        <motion.div
                                            className="form-group modern-input"
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.6 }}
                                        >
                                            <label>
                                                <motion.span whileHover={{ scale: 1.05 }}>Split type</motion.span>
                                            </label>
                                            <div className="split-type-selector modern-split-selector">
                                                <div className="split-type-icons modern-split-icons">
                                                    {["equal", "unequal", "percent", "shares"].map((type, index) => (
                                                        <motion.div
                                                            key={type}
                                                            className={`split-type-icon modern-split-icon ${expenseForm.splitType === type ? 'active' : ''}`}
                                                            onClick={() => handleExpenseFormChange({ target: { name: 'splitType', value: type } })}
                                                            whileHover={{ y: -5, boxShadow: "0 8px 20px rgba(105, 162, 151, 0.2)" }}
                                                            whileTap={{ scale: 0.95 }}
                                                            initial={{ y: 20, opacity: 0 }}
                                                            animate={{ y: 0, opacity: 1 }}
                                                            transition={{ delay: 0.6 + index * 0.05 }}
                                                        >
                                                            <div className={`icon-${type}`}>
                                                                {type === "equal" && (
                                                                    <div className="equal-bars">
                                                                        <div className="equal-bar"></div>
                                                                        <div className="equal-bar"></div>
                                                                    </div>
                                                                )}
                                                                {type === "unequal" && (
                                                                    <div className="unequal-bars">
                                                                        <div className="unequal-bar tall"></div>
                                                                        <div className="unequal-bar medium"></div>
                                                                        <div className="unequal-bar short"></div>
                                                                    </div>
                                                                )}
                                                                {type === "percent" && <div>%</div>}
                                                                {type === "shares" && <div className="shares-pie"></div>}
                                                            </div>
                                                            <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>

                                        <motion.div
                                            className={`form-group modern-input ${formErrors.participants ? 'has-error' : ''}`}
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.7 }}
                                        >
                                            <label>
                                                <motion.span whileHover={{ scale: 1.05 }}>Split between</motion.span>
                                            </label>
                                            <div className="member-checkboxes modern-checkboxes" role="group" aria-labelledby="participants-label">
                                                <span id="participants-label" className="sr-only">Select participants</span>
                                                <div className="checkbox-grid">
                                                    {group.members.map((member, index) => (
                                                        <motion.div
                                                            key={member.id}
                                                            className="member-checkbox modern-checkbox"
                                                            initial={{ opacity: 0, y: 5 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: 0.7 + index * 0.05 }}
                                                            whileHover={{
                                                                backgroundColor: "rgba(105, 162, 151, 0.1)",
                                                                scale: 1.02
                                                            }}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                id={`member-${member.id}`}
                                                                checked={expenseForm.participants.includes(member.id)}
                                                                onChange={() => handleParticipantChange(member.id)}
                                                                aria-invalid={formErrors.participants ? "true" : "false"}
                                                            />
                                                            <label htmlFor={`member-${member.id}`} className="checkbox-label">
                                                                <div className="checkbox-participant-avatar">
                                                                    <motion.img
                                                                        src={member.avatar}
                                                                        alt={member.name}
                                                                        whileHover={{ scale: 1.2 }}
                                                                    />
                                                                </div>
                                                                <span>{member.name}</span>
                                                            </label>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>
                                            {formErrors.participants && (
                                                <motion.p
                                                    className="form-error"
                                                    role="alert"
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                >
                                                    {formErrors.participants}
                                                </motion.p>
                                            )}
                                        </motion.div>

                                        {/* Dynamic split details based on split type */}
                                        {expenseForm.participants.length > 0 && (
                                            <motion.div
                                                className="form-group split-type-details"
                                                initial={{ y: 20, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                transition={{ delay: 0.8 }}
                                            >
                                                <AnimatePresence mode="wait">
                                                    <motion.div
                                                        key={expenseForm.splitType}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -20 }}
                                                        transition={{ duration: 0.3 }}
                                                    >
                                                        {renderSplitDetails()}
                                                    </motion.div>
                                                </AnimatePresence>
                                            </motion.div>
                                        )}

                                        <div className="form-row">
                                            <motion.div
                                                className="form-group modern-input"
                                                initial={{ y: 20, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                transition={{ delay: 0.9 }}
                                            >
                                                <label htmlFor="category">
                                                    <motion.span whileHover={{ scale: 1.05 }}>Category</motion.span>
                                                </label>
                                                <div className="category-selector modern-category-selector">
                                                    <div className="category-icons modern-category-icons">
                                                        {[
                                                            { id: 'food', icon: '🍔' },
                                                            { id: 'accommodation', icon: '🏠' },
                                                            { id: 'transportation', icon: '🚕' },
                                                            { id: 'entertainment', icon: '🎭' },
                                                            { id: 'utilities', icon: '💡' },
                                                            { id: 'other', icon: '📦' }
                                                        ].map((cat, index) => (
                                                            <motion.div
                                                                key={cat.id}
                                                                className={`category-icon modern-category-icon ${expenseForm.category === cat.id ? 'active' : ''}`}
                                                                onClick={() => handleExpenseFormChange({ target: { name: 'category', value: cat.id } })}
                                                                whileHover={{ scale: 1.1, y: -5 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                initial={{ scale: 0, opacity: 0 }}
                                                                animate={{ scale: 1, opacity: 1 }}
                                                                transition={{ delay: 0.9 + index * 0.05 }}
                                                            >
                                                                <span role="img" aria-label={cat.id}>{cat.icon}</span>
                                                                <div className="category-tooltip">{cat.id.charAt(0).toUpperCase() + cat.id.slice(1)}</div>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </motion.div>

                                            <motion.div
                                                className="form-group modern-input"
                                                initial={{ y: 20, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                transition={{ delay: 1.0 }}
                                            >
                                                <label htmlFor="date">
                                                    <motion.span whileHover={{ scale: 1.05 }}>Date</motion.span>
                                                </label>
                                                <div className="date-input-wrapper modern-date">
                                                    <Calendar size={16} className="date-icon" />
                                                    <input
                                                        type="date"
                                                        id="date"
                                                        name="date"
                                                        value={expenseForm.date}
                                                        onChange={handleExpenseFormChange}
                                                        className="modern-date-input"
                                                    />
                                                </div>
                                            </motion.div>
                                        </div>

                                        <motion.div
                                            className="form-group modern-input"
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 1.1 }}
                                        >
                                            <label htmlFor="notes">
                                                <motion.span whileHover={{ scale: 1.05 }}>Notes (optional)</motion.span>
                                            </label>
                                            <textarea
                                                id="notes"
                                                name="notes"
                                                placeholder="Add any additional details..."
                                                value={expenseForm.notes}
                                                onChange={handleExpenseFormChange}
                                                rows="3"
                                                className="modern-textarea"
                                            ></textarea>
                                        </motion.div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    className="modal-footer modern-footer"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1.2 }}
                                >
                                    <motion.button
                                        className="cancel-btn modern-cancel"
                                        onClick={toggleQuickAdd}
                                        whileHover={{
                                            backgroundColor: "rgba(0, 0, 0, 0.05)",
                                            scale: 1.02
                                        }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        Cancel
                                    </motion.button>
                                    <motion.button
                                        className="save-btn modern-save"
                                        onClick={handleSaveExpense}
                                        whileHover={{
                                            y: -3,
                                            boxShadow: "0 8px 25px rgba(105, 162, 151, 0.5)",
                                            scale: 1.03
                                        }}
                                        whileTap={{ scale: 0.97 }}
                                        disabled={Object.keys(formErrors).length > 0}
                                    >
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                className="save-button-content"
                                                key={Object.keys(formErrors).length > 0 ? 'disabled' : 'enabled'}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                            >
                                                {Object.keys(formErrors).length > 0 ? (
                                                    <Info size={16} className="save-icon" />
                                                ) : (
                                                    <Check size={16} className="save-icon" />
                                                )}
                                                <span>Save Expense</span>
                                            </motion.div>
                                        </AnimatePresence>
                                    </motion.button>
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Confirmation Dialog */}
                <AnimatePresence>
                    {isConfirmDialogOpen && (
                        <motion.div
                            className="modal-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.div
                                className="modal-content confirm-dialog"
                                style={{ maxWidth: "400px" }}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                role="alertdialog"
                                aria-labelledby="confirm-dialog-title"
                                aria-describedby="confirm-dialog-desc"
                            >
                                <div className="modal-header">
                                    <h2 id="confirm-dialog-title">
                                        <Info size={18} className="modal-title-icon warning" />
                                        Confirm Action
                                    </h2>
                                </div>
                                <div className="modal-body">
                                    <p id="confirm-dialog-desc">
                                        {memberToRemove
                                            ? `Are you sure you want to remove ${memberToRemove.name} from the group?`
                                            : 'Are you sure you want to perform this action?'
                                        }
                                    </p>
                                    {memberToRemove && (
                                        <div className="confirm-member-details">
                                            <div className="confirm-member-avatar">
                                                <img src={memberToRemove.avatar} alt={memberToRemove.name} />
                                            </div>
                                            <div className="confirm-member-info">
                                                <span className="confirm-member-name">{memberToRemove.name}</span>
                                                <span className="confirm-member-email">{memberToRemove.email}</span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="confirm-warning">
                                        <p>This action cannot be undone.</p>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <motion.button
                                        className="cancel-btn"
                                        onClick={handleCancelConfirm}
                                        whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.05)" }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Cancel
                                    </motion.button>
                                    <motion.button
                                        className="save-btn danger"
                                        onClick={handleConfirmAction}
                                        whileHover={{ y: -3, boxShadow: "0 6px 20px rgba(229, 62, 62, 0.3)" }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Confirm
                                    </motion.button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
            {/* Export Modal */}
            <GroupExport
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                group={group}
                expenses={expenses}
                members={group.members}
                balances={balances}
            />
        </motion.div>
    );
};

export default GroupDetails;