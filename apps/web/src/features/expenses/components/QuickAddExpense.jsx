import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Check, ChevronDown, Info, PlusCircle, X } from 'lucide-react';
import { VIEWER_ID } from '../../../shared/people/viewer';

/**
 * 7.4 -- extracted from GroupDetails verbatim (behaviour-preserving).
 * renderSplitDetails still arrives as a prop; it becomes the real
 * ExpenseSplitEditor later in this phase.
 */
const QuickAddExpense = ({
    group,
    expenseForm,
    formErrors,
    handleExpenseFormChange,
    handleAmountChange,
    handleParticipantChange,
    handleSaveExpense,
    toggleQuickAdd,
    renderSplitDetails,
}) => (
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
);

export default QuickAddExpense;
