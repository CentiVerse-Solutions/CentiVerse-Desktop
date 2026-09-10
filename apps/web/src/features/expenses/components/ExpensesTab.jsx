import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, Edit2, PlusCircle, RefreshCw, Trash2 } from 'lucide-react';
import { VIEWER_ID } from '../../../shared/people/viewer';

/**
 * 7.4 -- extracted from GroupDetails verbatim. Behaviour-preserving:
 * identical markup, ARIA wiring and animation variants; the state it reads
 * now arrives as props.
 */
const ExpensesTab = ({
    group,
    filteredExpenses,
    formatCurrency,
    hoveredExpense,
    setHoveredExpense,
    toggleQuickAdd,
    containerVariants,
    cardVariants,
}) => (
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
                                                            <span role="img" aria-label={expense.category?.name ?? 'Uncategorised'}>{expense.category?.icon ?? '🧾'}</span>
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
);

export default ExpensesTab;
