import { useState } from 'react';
import { VIEWER_ID } from '../../shared/people/viewer';
import { calculateExactSplit } from '../expenses/splitPreview';

/**
 * 7.4 -- the expense form: its state, field handlers, split calculation,
 * validation and save path. Lifted out of useGroupDetails verbatim.
 *
 * Everything it needs from the surrounding screen (the group, the create
 * mutation, the form-error setter, the modal closer) arrives as arguments, so
 * the form has no opinion about how the page is laid out.
 */
export const useExpenseForm = ({
    group,
    groupId,
    createExpense,
    formErrors,
    setFormErrors,
    setIsQuickAddOpen,
}) => {
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

    return {
        expenseForm,
        setExpenseForm,
        splitValues,
        setSplitValues,
        handleExpenseFormChange,
        handleAmountChange,
        handleParticipantChange,
        handleSplitValueChange,
        calculateSplitValues,
        validateExpenseForm,
        handleSaveExpense,
        resetExpenseForm,
        getCategoryName,
        getCategoryIcon,
    };
};
