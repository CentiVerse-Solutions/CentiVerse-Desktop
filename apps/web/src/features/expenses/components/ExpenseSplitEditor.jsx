import { motion } from 'framer-motion';
import { calculateExactSplit } from '../splitPreview';

/**
 * 7.4 -- the split editor, lifted out of GroupDetails' renderSplitDetails().
 * Behaviour-preserving: the body is the original function verbatim, now a
 * component taking the state it reads as props.
 *
 * The five-strategy editor with a live preview from @centiverse/core and a
 * running remainder indicator (7.6) builds on this next.
 */
const ExpenseSplitEditor = ({
    group,
    expenseForm,
    splitValues,
    formErrors,
    formatCurrency,
    handleSplitValueChange,
}) => {
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
                ? calculateExactSplit(parsedAmount, participants)
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

export default ExpenseSplitEditor;
