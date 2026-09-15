import { useState } from 'react';
import { VIEWER_ID } from '../../shared/people/viewer';
import { getCategoryName, getCategoryIcon } from './categories';
import {
    calculateSplitValues as computeSplitValues,
    validateExpenseForm as validateForm,
} from './expenseFormLogic';

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
    const calculateSplitValues = () => computeSplitValues({ expenseForm, splitValues });
    const validateExpenseForm = () => validateForm({ expenseForm, splitValues });

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
