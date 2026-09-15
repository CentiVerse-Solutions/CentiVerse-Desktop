import { calculateExactSplit } from './splitPreview';

/**
 * Split calculation and form validation, as pure functions of the form state.
 *
 * They were closures over useExpenseForm's state; taking that state as an
 * argument instead makes them testable and keeps the hook to wiring.
 * Behaviour-preserving: the bodies are unchanged.
 */
export const calculateSplitValues = ({ expenseForm, splitValues }) => {
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
export const validateExpenseForm = ({ expenseForm, splitValues }) => {
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
