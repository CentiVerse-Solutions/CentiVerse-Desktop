import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';

/**
 * 7.4 -- split out of QuickAddExpense verbatim to bring it under the
 * 300-line limit. Behaviour-preserving.
 */
const ExpenseFormExtras = ({
    expenseForm,
    handleExpenseFormChange,
}) => (
    <>
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
    </>
);

export default ExpenseFormExtras;
