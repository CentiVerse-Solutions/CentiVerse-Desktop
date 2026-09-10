import { motion, AnimatePresence } from 'framer-motion';
import ExpenseFormBasics from './ExpenseFormBasics';
import ExpenseParticipants from './ExpenseParticipants';
import ExpenseFormExtras from './ExpenseFormExtras';
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
    splitEditor,
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
                    <ExpenseFormBasics
                        group={group}
                        expenseForm={expenseForm}
                        formErrors={formErrors}
                        handleExpenseFormChange={handleExpenseFormChange}
                        handleAmountChange={handleAmountChange}
                    />
    
                    <ExpenseParticipants
                        group={group}
                        expenseForm={expenseForm}
                        formErrors={formErrors}
                        handleParticipantChange={handleParticipantChange}
                        handleExpenseFormChange={handleExpenseFormChange}
                    />
    
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
                                    {splitEditor}
                                </motion.div>
                            </AnimatePresence>
                        </motion.div>
                    )}
    
                    <ExpenseFormExtras
                        expenseForm={expenseForm}
                        handleExpenseFormChange={handleExpenseFormChange}
                    />
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
