import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { VIEWER_ID } from '../../../shared/people/viewer';

/**
 * 7.4 -- split out of QuickAddExpense verbatim to bring it under the
 * 300-line limit. Behaviour-preserving.
 */
const ExpenseFormBasics = ({
    group,
    expenseForm,
    formErrors,
    handleExpenseFormChange,
    handleAmountChange,
}) => (
    <>
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
    </>
);

export default ExpenseFormBasics;
