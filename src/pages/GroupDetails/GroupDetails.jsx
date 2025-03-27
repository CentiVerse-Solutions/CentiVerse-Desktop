import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './GroupDetails.css';
// import SideNavbar from '../../components/layout/SideNavbar/SideNavbar';

// Import mock data for testing
import { mockGroups, mockExpenses, mockFriends } from '../../utils/mockData';

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

    // State for the expense form
    const [expenseForm, setExpenseForm] = useState({
        description: '',
        amount: '',
        paidBy: 'you',
        splitType: 'equal',
        date: new Date().toISOString().slice(0, 10),
        category: 'food',
        participants: []
    });

    // State for individual splits when using unequal, percentage, or shares
    const [splitValues, setSplitValues] = useState({});
    const [memberToRemove, setMemberToRemove] = useState(null);

    // Memoized fetch function to avoid recreation on each render
    const fetchGroupData = useCallback(async () => {
        setIsLoading(true);

        try {
            // Simulate API call with delay
            await new Promise(resolve => setTimeout(resolve, 300));

            // In a real app, these would be API calls
            const selectedGroup = mockGroups.find(g => g.id === parseInt(groupId));

            if (!selectedGroup) {
                // Handle 404 - Group not found
                navigate('/dashboard');
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
            // Show error notification in a real app
        } finally {
            setIsLoading(false);

            // Fade in animation once loaded
            const element = document.querySelector('.group-details-page');
            if (element) {
                element.classList.add('loaded');
            }
        }
    }, [groupId, navigate]);

    // Load data on mount or when groupId changes
    useEffect(() => {
        fetchGroupData();
    }, [fetchGroupData]);

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

        const { description, amount, paidBy, category, date, participants } = expenseForm;

        // Calculate split values
        const splitResults = calculateSplitValues();

        // Find the payer object
        const payer = paidBy === 'you'
            ? group.members.find(m => m.name === 'You')
            : group.members.find(m => m.id === paidBy);

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
            splitValues: splitResults || {} // Fallback to empty object if null
        };

        // Add to expenses - create a new array to ensure state update
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
            participants: group ? group.members.map(member => member.id) : []
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
                : group.members.find(m => m.name === 'You'), // You owe them
            category: {
                id: 'other',
                name: 'Settlement',
                icon: '💰'
            },
            participants: [
                member,
                group.members.find(m => m.name === 'You')
            ],
            isSettlement: true
        };

        // Add to expenses list
        setExpenses([settlement, ...expenses]);

        // Show success notification (in a real app)
        console.log('Settlement added:', settlement);
    };

    // Handle member removal with confirmation
    const handleRemoveMember = (memberId) => {
        if (!group) return;

        // Find the member
        const member = group.members.find(m => m.id === memberId);
        if (!member || member.name === 'You') return;

        // Set up confirmation dialog
        setMemberToRemove(member);
        setConfirmAction(() => () => {
            // This would be an API call in a real app
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
                    balances[participantId].balance -= parseFloat(amount);
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
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: group?.currency || 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    };

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
    if (isLoading || !group) {
        return (
            <div className="loading-container" role="alert" aria-live="polite">
                <motion.div
                    className="loading-spinner"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    aria-hidden="true"
                ></motion.div>
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    Loading group details...
                </motion.p>
            </div>
        );
    }

    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

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
        exit: { opacity: 0, y: -20 }
    };

    const itemVariants = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 }
    };

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
                            <div key={member.id} className="split-item">
                                <div className="split-member">
                                    <div className="user-avatar small">
                                        <img src={member.avatar} alt={member.name} />
                                    </div>
                                    <span>{member.name}</span>
                                </div>
                                <span className="split-amount">{parsedAmount ? formatCurrency(parseFloat(equalShares[index])) : '—'}</span>
                            </div>
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
                        {participatingMembers.map(member => (
                            <div key={member.id} className="split-item">
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
                            </div>
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
                        {participatingMembers.map(member => (
                            <div key={member.id} className="split-item">
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
                            </div>
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
                        {participatingMembers.map(member => (
                            <div key={member.id} className="split-item">
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
                            </div>
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
            className="group-details-page"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
        >
            {/* Main Content */}
            <motion.div
                className="main-content"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
            >
                {/* Top Navigation */}
                <motion.div
                    className="top-nav"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <motion.h1
                        className="app-title"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        CentiVerse
                    </motion.h1>
                    <div className="top-nav-actions">
                        <motion.button
                            className="user-profile"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            aria-label="User profile"
                        >
                            <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Your profile" />
                        </motion.button>
                    </div>
                </motion.div>

                {/* Group Header */}
                <motion.div
                    className="group-header"
                    style={{ backgroundImage: `url(${group.banner})` }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <div className="group-header-overlay">
                        <motion.div
                            className="group-info"
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.6, type: "spring" }}
                        >
                            <motion.div
                                className="group-avatar"
                                whileHover={{ scale: 1.05 }}
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
                                    transition={{ delay: 0.7 }}
                                >
                                    {group.name}
                                </motion.h1>
                                <motion.p
                                    className="group-members"
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.8 }}
                                >
                                    {group.members.length} members · Created on {new Date(group.createdAt).toLocaleDateString()}
                                </motion.p>
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
                        <span className="action-icon" aria-hidden="true">+</span>
                        <span>Add Expense</span>
                    </motion.button>
                    <motion.button
                        className="action-btn secondary"
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            // Find a member with non-zero balance
                            const memberWithBalance = balances.find(b => b.balance !== 0 && b.name !== 'You');
                            if (memberWithBalance) {
                                handleSettleUp(memberWithBalance.id);
                            } else {
                                // Show notification that all balances are settled
                                console.log("All balances are settled");
                            }
                        }}
                    >
                        <span className="action-icon" aria-hidden="true">🔄</span>
                        <span>Settle Up</span>
                    </motion.button>
                    <div className="action-dropdown">
                        <motion.button
                            className="action-btn tertiary"
                            whileHover={{ y: -3 }}
                            whileTap={{ scale: 0.95 }}
                            aria-label="More options"
                            aria-haspopup="true"
                        >
                            <span className="action-icon" aria-hidden="true">⋮</span>
                            <span>More</span>
                        </motion.button>
                        <div className="dropdown-menu" role="menu">
                            <button className="dropdown-item" role="menuitem">
                                <span className="dropdown-icon" aria-hidden="true">💰</span>
                                <span>Balances</span>
                            </button>
                            <button className="dropdown-item" role="menuitem">
                                <span className="dropdown-icon" aria-hidden="true">📊</span>
                                <span>Charts</span>
                            </button>
                            <button className="dropdown-item" role="menuitem">
                                <span className="dropdown-icon" aria-hidden="true">🔄</span>
                                <span>Currency Conversion</span>
                            </button>
                            <button className="dropdown-item" role="menuitem">
                                <span className="dropdown-icon" aria-hidden="true">📋</span>
                                <span>Whiteboard</span>
                            </button>
                            <button className="dropdown-item" role="menuitem">
                                <span className="dropdown-icon" aria-hidden="true">📥</span>
                                <span>Export as CSV</span>
                            </button>
                            <button className="dropdown-item danger" role="menuitem">
                                <span className="dropdown-icon" aria-hidden="true">🚫</span>
                                <span>Leave Group</span>
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Group Summary */}
                <motion.div
                    className="group-summary"
                    variants={itemVariants}
                >
                    <motion.div
                        className="summary-card"
                        whileHover={{ y: -5, boxShadow: "0 12px 30px rgba(0, 0, 0, 0.1)" }}
                    >
                        <h3 className="summary-title">Total Expenses</h3>
                        <p className="summary-value">{formatCurrency(totalExpenses)}</p>
                    </motion.div>
                    <motion.div
                        className="summary-card"
                        whileHover={{ y: -5, boxShadow: "0 12px 30px rgba(0, 0, 0, 0.1)" }}
                    >
                        <h3 className="summary-title">Your Balance</h3>
                        <p className={`summary-value ${balances.find(b => b.name === 'You')?.balance > 0 ? 'positive' : balances.find(b => b.name === 'You')?.balance < 0 ? 'negative' : ''}`}>
                            {formatCurrency(balances.find(b => b.name === 'You')?.balance || 0)}
                        </p>
                    </motion.div>
                    <motion.div
                        className="summary-card"
                        whileHover={{ y: -5, boxShadow: "0 12px 30px rgba(0, 0, 0, 0.1)" }}
                    >
                        <h3 className="summary-title">Expenses Count</h3>
                        <p className="summary-value">{expenses.length}</p>
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
                        Totals
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
                        Members
                    </motion.button>
                </div>

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
                            {expenses && expenses.length > 0 ? (
                                expenses.map((expense, index) => (
                                    <motion.div
                                        key={expense.id || index}
                                        className="expense-item"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        whileHover={{ y: -5, boxShadow: "0 12px 30px rgba(0, 0, 0, 0.1)" }}
                                    >
                                        <div className="expense-date">
                                            <div className="date-badge">
                                                <span className="date-month">{new Date(expense.date).toLocaleString('default', { month: 'short' })}</span>
                                                <span className="date-day">{new Date(expense.date).getDate()}</span>
                                            </div>
                                        </div>
                                        <div className="expense-details">
                                            <div className="expense-icon">
                                                <span className="category-icon">{expense.category.icon}</span>
                                            </div>
                                            <div className="expense-info">
                                                <h3 className="expense-title">{expense.description}</h3>
                                                <p className="expense-paid-by">
                                                    <strong>{expense.paidBy.name}</strong> paid {formatCurrency(expense.amount)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="expense-amount">
                                            <p className="total-amount">{formatCurrency(expense.amount)}</p>
                                            <p className={`your-share ${expense.paidBy.name === 'You' ? 'positive' : 'negative'}`}>
                                                {expense.paidBy.name === 'You'
                                                    ? `You lent ${formatCurrency(expense.amount - (expense.splitValues?.['you'] || expense.amount / expense.participants.length))}`
                                                    : `You owe ${formatCurrency(expense.splitValues?.['you'] || expense.amount / expense.participants.length)}`
                                                }
                                            </p>
                                        </div>
                                    </motion.div>
                                ))
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
                                        Add an Expense
                                    </motion.button>
                                </motion.div>
                            )}
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
                            <div className="balance-cards">
                                {balances.map((balance, index) => (
                                    <motion.div
                                        key={balance.id}
                                        className="balance-card"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        whileHover={{ y: -5, boxShadow: "0 12px 30px rgba(0, 0, 0, 0.1)" }}
                                    >
                                        <div className="user-avatar">
                                            <img src={balance.avatar} alt={balance.name} />
                                        </div>
                                        <div className="balance-info">
                                            <h3 className="user-name">{balance.name}</h3>
                                            <p className={`balance-amount ${balance.balance > 0 ? 'positive' : balance.balance < 0 ? 'negative' : ''}`}>
                                                {balance.balance > 0
                                                    ? `owes you ${formatCurrency(Math.abs(balance.balance))}`
                                                    : balance.balance < 0
                                                        ? `you owe ${formatCurrency(Math.abs(balance.balance))}`
                                                        : `settled up`
                                                }
                                            </p>
                                        </div>
                                        {balance.balance !== 0 && balance.name !== 'You' && (
                                            <motion.button
                                                className="settle-btn"
                                                whileHover={{ y: -2, scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleSettleUp(balance.id)}
                                            >
                                                Settle
                                            </motion.button>
                                        )}
                                    </motion.div>
                                ))}
                            </div>

                            <motion.div
                                className="simplify-debts"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <h3>Simplified Balances</h3>
                                <p>The most efficient way to settle all debts</p>
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
                                                transition={{ delay: 0.4 + (index * 0.1) }}
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
                                                <p className="transaction-amount">
                                                    {formatCurrency(Math.abs(debtor.balance))}
                                                </p>
                                            </motion.div>
                                        );
                                    })}

                                    {balances.filter(b => b.balance < 0).length === 0 && (
                                        <div className="form-message">
                                            All balances are settled! 🎉
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {/* Totals Tab */}
                    {activeTab === 'totals' && (
                        <div
                            className="totals-container"
                            role="tabpanel"
                            id="totals-tab"
                            aria-labelledby="totals-tab-btn"
                        >
                            <motion.div
                                className="category-totals"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <h3>Spending by Category</h3>
                                <div className="category-bars">
                                    {/* Calculate category totals from actual expenses */}
                                    {(() => {
                                        // Get unique categories
                                        const categories = {};
                                        expenses.forEach(expense => {
                                            const categoryId = expense.category.id;
                                            if (!categories[categoryId]) {
                                                categories[categoryId] = {
                                                    id: categoryId,
                                                    name: expense.category.name,
                                                    icon: expense.category.icon,
                                                    total: 0
                                                };
                                            }
                                            categories[categoryId].total += expense.amount;
                                        });

                                        // Convert to array and sort by total
                                        const sortedCategories = Object.values(categories)
                                            .sort((a, b) => b.total - a.total);

                                        // Find max value for percentage calculation
                                        const maxValue = sortedCategories.length > 0
                                            ? sortedCategories[0].total
                                            : 0;

                                        return sortedCategories.length > 0 ? (
                                            sortedCategories.map((category, index) => (
                                                <motion.div
                                                    key={category.id}
                                                    className="category-bar"
                                                    initial={{ opacity: 0, scaleX: 0.5 }}
                                                    animate={{ opacity: 1, scaleX: 1 }}
                                                    transition={{ delay: 0.3 + (index * 0.1) }}
                                                >
                                                    <div className="category-info">
                                                        <span className="category-icon" aria-hidden="true">{category.icon}</span>
                                                        <span className="category-name">{category.name}</span>
                                                    </div>
                                                    <div className="bar-container">
                                                        <motion.div
                                                            className="bar-progress"
                                                            initial={{ width: "0%" }}
                                                            animate={{ width: `${(category.total / maxValue * 100)}%` }}
                                                            transition={{ delay: 0.4 + (index * 0.1), duration: 1 }}
                                                        ></motion.div>
                                                    </div>
                                                    <span className="category-amount">{formatCurrency(category.total)}</span>
                                                </motion.div>
                                            ))
                                        ) : (
                                            <div className="form-message">
                                                No expense data to display
                                            </div>
                                        );
                                    })()}
                                </div>
                            </motion.div>

                            <motion.div
                                className="month-totals"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <h3>Monthly Spending</h3>
                                <div className="month-bars">
                                    {(() => {
                                        // Group expenses by month
                                        const months = {};
                                        expenses.forEach(expense => {
                                            const date = new Date(expense.date);
                                            const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
                                            const monthName = date.toLocaleString('default', { month: 'short' });

                                            if (!months[monthKey]) {
                                                months[monthKey] = {
                                                    key: monthKey,
                                                    name: monthName,
                                                    total: 0
                                                };
                                            }
                                            months[monthKey].total += expense.amount;
                                        });

                                        // Convert to array and sort by month
                                        const sortedMonths = Object.values(months)
                                            .sort((a, b) => a.key.localeCompare(b.key));

                                        // Find max value for percentage calculation
                                        const maxValue = sortedMonths.length > 0
                                            ? Math.max(...sortedMonths.map(m => m.total))
                                            : 0;

                                        return sortedMonths.length > 0 ? (
                                            sortedMonths.map((month, index) => (
                                                <motion.div
                                                    key={month.key}
                                                    className="month-bar"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 0.5 + (index * 0.1) }}
                                                >
                                                    <span className="month-name">{month.name}</span>
                                                    <div className="bar-container vertical">
                                                        <motion.div
                                                            className="bar-progress"
                                                            initial={{ height: "0%" }}
                                                            animate={{ height: `${(month.total / maxValue * 100)}%` }}
                                                            transition={{ delay: 0.6 + (index * 0.1), duration: 1 }}
                                                        ></motion.div>
                                                    </div>
                                                    <span className="month-amount">{formatCurrency(month.total)}</span>
                                                </motion.div>
                                            ))
                                        ) : (
                                            <div className="form-message">
                                                No expense data to display
                                            </div>
                                        );
                                    })()}
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
                                <h3>Group Members ({group.members.length})</h3>
                                <motion.button
                                    className="add-member-btn"
                                    whileHover={{ y: -3, boxShadow: "0 6px 20px rgba(105, 162, 151, 0.4)" }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <span className="add-icon" aria-hidden="true">+</span>
                                    <span>Add Member</span>
                                </motion.button>
                            </motion.div>

                            <div className="members-list">
                                {group.members.map((member, index) => (
                                    <motion.div
                                        key={member.id}
                                        className="member-card"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 + (index * 0.1) }}
                                        whileHover={{ y: -5, boxShadow: "0 12px 30px rgba(0, 0, 0, 0.1)" }}
                                    >
                                        <div className="member-avatar">
                                            <img src={member.avatar} alt={member.name} />
                                        </div>
                                        <div className="member-info">
                                            <h3 className="member-name">{member.name}</h3>
                                            <p className="member-email">{member.email}</p>
                                        </div>
                                        {member.name !== 'You' && (
                                            <motion.button
                                                className="remove-member-btn"
                                                whileHover={{ scale: 1.1, backgroundColor: "rgba(229, 62, 62, 0.2)" }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => handleRemoveMember(member.id)}
                                                aria-label={`Remove ${member.name}`}
                                            >
                                                <span className="remove-icon" aria-hidden="true">×</span>
                                            </motion.button>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Add Expense Modal - Enhanced with split type UI */}
                <AnimatePresence>
                    {isQuickAddOpen && (
                        <motion.div
                            className="modal-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={(e) => {
                                // Close modal when clicking the overlay (outside the modal)
                                if (e.target === e.currentTarget) {
                                    toggleQuickAdd();
                                }
                            }}
                        >
                            <motion.div
                                className="modal-content quick-add-modal"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()} // Prevent clicking inside modal from closing it
                                role="dialog"
                                aria-labelledby="expense-modal-title"
                                aria-modal="true"
                            >
                                <div className="modal-header">
                                    <h2 id="expense-modal-title">Add an expense</h2>
                                    <motion.button
                                        className="close-modal-btn"
                                        onClick={toggleQuickAdd}
                                        whileHover={{ rotate: 90, backgroundColor: "rgba(0, 0, 0, 0.1)" }}
                                        whileTap={{ scale: 0.9 }}
                                        aria-label="Closemodal"
                                    >×</motion.button>
                                </div>

                                <div className="modal-body">
                                    <div className="expense-form">
                                        <div className={`form-group ${formErrors.description ? 'has-error' : ''}`}>
                                            <label htmlFor="description">Description</label>
                                            <input
                                                type="text"
                                                id="description"
                                                name="description"
                                                placeholder="What was this expense for?"
                                                value={expenseForm.description}
                                                onChange={handleExpenseFormChange}
                                                aria-invalid={formErrors.description ? "true" : "false"}
                                                aria-describedby={formErrors.description ? "description-error" : undefined}
                                            />
                                            {formErrors.description && (
                                                <p className="form-error" id="description-error" role="alert">
                                                    {formErrors.description}
                                                </p>
                                            )}
                                        </div>

                                        <div className={`form-group ${formErrors.amount ? 'has-error' : ''}`}>
                                            <label htmlFor="amount">Amount</label>
                                            <div className="amount-input">
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
                                                />
                                            </div>
                                            {formErrors.amount && (
                                                <p className="form-error" id="amount-error" role="alert">
                                                    {formErrors.amount}
                                                </p>
                                            )}
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="paidBy">Paid by</label>
                                            <select
                                                id="paidBy"
                                                name="paidBy"
                                                value={expenseForm.paidBy}
                                                onChange={handleExpenseFormChange}
                                                aria-invalid={formErrors.paidBy ? "true" : "false"}
                                                aria-describedby={formErrors.paidBy ? "paidBy-error" : undefined}
                                            >
                                                <option value="you">You</option>
                                                {group.members.filter(m => m.name !== 'You').map(member => (
                                                    <option key={member.id} value={member.id}>{member.name}</option>
                                                ))}
                                            </select>
                                            {formErrors.paidBy && (
                                                <p className="form-error" id="paidBy-error" role="alert">
                                                    {formErrors.paidBy}
                                                </p>
                                            )}
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="splitType">Split type</label>
                                            <select
                                                id="splitType"
                                                name="splitType"
                                                value={expenseForm.splitType}
                                                onChange={handleExpenseFormChange}
                                            >
                                                <option value="equal">Equally</option>
                                                <option value="unequal">Unequally</option>
                                                <option value="percent">By percentage</option>
                                                <option value="shares">By shares</option>
                                            </select>
                                        </div>

                                        <div className={`form-group ${formErrors.participants ? 'has-error' : ''}`}>
                                            <label>Split between</label>
                                            <div className="member-checkboxes" role="group" aria-labelledby="participants-label">
                                                <span id="participants-label" className="sr-only">Select participants</span>
                                                {group.members.map(member => (
                                                    <div key={member.id} className="member-checkbox">
                                                        <input
                                                            type="checkbox"
                                                            id={`member-${member.id}`}
                                                            checked={expenseForm.participants.includes(member.id)}
                                                            onChange={() => handleParticipantChange(member.id)}
                                                            aria-invalid={formErrors.participants ? "true" : "false"}
                                                        />
                                                        <label htmlFor={`member-${member.id}`}>{member.name}</label>
                                                    </div>
                                                ))}
                                            </div>
                                            {formErrors.participants && (
                                                <p className="form-error" role="alert">
                                                    {formErrors.participants}
                                                </p>
                                            )}
                                        </div>

                                        {/* Dynamic split details based on split type */}
                                        {expenseForm.participants.length > 0 && (
                                            <div className="form-group split-type-details">
                                                <label>Split details</label>
                                                {renderSplitDetails()}
                                            </div>
                                        )}

                                        <div className="form-group">
                                            <label htmlFor="category">Category</label>
                                            <select
                                                id="category"
                                                name="category"
                                                value={expenseForm.category}
                                                onChange={handleExpenseFormChange}
                                            >
                                                <option value="food">Food & Drink</option>
                                                <option value="accommodation">Accommodation</option>
                                                <option value="transportation">Transportation</option>
                                                <option value="entertainment">Entertainment</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="date">Date</label>
                                            <input
                                                type="date"
                                                id="date"
                                                name="date"
                                                value={expenseForm.date}
                                                onChange={handleExpenseFormChange}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <motion.button
                                        className="cancel-btn"
                                        onClick={toggleQuickAdd}
                                        whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.05)" }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Cancel
                                    </motion.button>
                                    <motion.button
                                        className="save-btn"
                                        onClick={handleSaveExpense}
                                        whileHover={{ y: -3, boxShadow: "0 6px 20px rgba(105, 162, 151, 0.4)" }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Save Expense
                                    </motion.button>
                                </div>
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
                                className="modal-content"
                                style={{ maxWidth: "400px" }}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                role="alertdialog"
                                aria-labelledby="confirm-dialog-title"
                                aria-describedby="confirm-dialog-desc"
                            >
                                <div className="modal-header">
                                    <h2 id="confirm-dialog-title">Confirm Action</h2>
                                </div>
                                <div className="modal-body">
                                    <p id="confirm-dialog-desc">
                                        {memberToRemove
                                            ? `Are you sure you want to remove ${memberToRemove.name} from the group?`
                                            : 'Are you sure you want to perform this action?'
                                        }
                                    </p>
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
                                        style={{ backgroundColor: "var(--negative)" }}
                                    >
                                        Confirm
                                    </motion.button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
};

export default GroupDetails;