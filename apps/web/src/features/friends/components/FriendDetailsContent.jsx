import { FRIEND_EXPENSES as mockExpenses } from '../friendDetailsSeed';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Avatar } from '../../../components/common/Avatar/Avatar';
import { AlertCircle, ChevronDown, DollarSign, Mail, MoreHorizontal, Phone, Receipt } from 'lucide-react';

/**
 * 7.4 -- split out verbatim (behaviour-preserving).
 */
const FriendDetailsContent = ({
    activeTab,
    balanceInfo,
    expandedExpenses,
    formatDate,
    formatTime,
    friend,
    setActiveTab,
    toggleExpenseDetails,
}) => (
    <div className="fr-details-content">
        <div className="fr-profile">
            <div className="fr-profile-header">
                <Avatar
                    src={friend.avatar}
                    alt={friend.name}
                    size="xlarge"
                />
                <h2 className="fr-profile-name">{friend.name}</h2>
    
                <div className={`fr-balance-badge ${balanceInfo.className}`}>
                    {balanceInfo.icon}
                    <span>{balanceInfo.text}</span>
                </div>
            </div>
    
            <div className="fr-profile-actions">
                <button className="fr-profile-action-btn">
                    <Receipt size={20} />
                    <span>Add expense</span>
                </button>
    
                <button className="fr-profile-action-btn">
                    <DollarSign size={20} />
                    <span>Settle up</span>
                </button>
    
                <button className="fr-profile-action-btn">
                    <MoreHorizontal size={20} />
                    <span>More</span>
                </button>
            </div>
        </div>
    
        <Tabs
            defaultValue="expenses"
            value={activeTab}
            onValueChange={setActiveTab}
            className="fr-details-tabs"
        >
            <TabsList className="fr-tabs-list">
                <TabsTrigger value="expenses" className="fr-tab-trigger">
                    Expenses
                </TabsTrigger>
                <TabsTrigger value="info" className="fr-tab-trigger">
                    Info
                </TabsTrigger>
            </TabsList>
    
            <TabsContent value="expenses" className="fr-tab-content">
                <div className="fr-expenses-list">
                    {mockExpenses.map(expense => (
                        <div key={expense.id} className="fr-expense-item">
                            <div
                                className="fr-expense-header"
                                onClick={() => toggleExpenseDetails(expense.id)}
                            >
                                <div className="fr-expense-date">
                                    <span className="fr-expense-month">
                                        {new Date(expense.date).toLocaleDateString('en-US', { month: 'short' })}
                                    </span>
                                    <span className="fr-expense-day">
                                        {new Date(expense.date).getDate()}
                                    </span>
                                </div>
    
                                <div className="fr-expense-info">
                                    <h4 className="fr-expense-description">{expense.description}</h4>
                                    <p className="fr-expense-paid-by">
                                        {expense.paidBy === 'you'
                                            ? 'You paid'
                                            : `${friend.name} paid`
                                        }
                                    </p>
                                </div>
    
                                <div className="fr-expense-amount">
                                    <span>${expense.amount.toFixed(2)}</span>
                                    <ChevronDown
                                        size={16}
                                        className={`fr-expense-toggle ${expandedExpenses[expense.id] ? 'expanded' : ''}`}
                                    />
                                </div>
                            </div>
    
                            <AnimatePresence>
                                {expandedExpenses[expense.id] && (
                                    <motion.div
                                        className="fr-expense-details"
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className="fr-expense-details-content">
                                            <div className="fr-expense-detail-item">
                                                <span className="fr-detail-label">Date:</span>
                                                <span className="fr-detail-value">
                                                    {formatDate(expense.date)} at {formatTime(expense.date)}
                                                </span>
                                            </div>
    
                                            <div className="fr-expense-detail-item">
                                                <span className="fr-detail-label">Total:</span>
                                                <span className="fr-detail-value">${expense.amount.toFixed(2)}</span>
                                            </div>
    
                                            <div className="fr-expense-detail-item">
                                                <span className="fr-detail-label">Paid by:</span>
                                                <span className="fr-detail-value">
                                                    {expense.paidBy === 'you' ? 'You' : friend.name}
                                                </span>
                                            </div>
    
                                            <h5 className="fr-split-heading">Split Details</h5>
    
                                            <div className="fr-split-details">
                                                <div className="fr-split-item">
                                                    <span className="fr-split-label">You:</span>
                                                    <span className="fr-split-value">${expense.split.you.toFixed(2)}</span>
                                                </div>
    
                                                <div className="fr-split-item">
                                                    <span className="fr-split-label">{friend.name}:</span>
                                                    <span className="fr-split-value">${expense.split.friend.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </TabsContent>
    
            <TabsContent value="info" className="fr-tab-content">
                <div className="fr-info-content">
                    <div className="fr-info-section">
                        <h3 className="fr-info-section-title">Contact</h3>
    
                        {friend.email && (
                            <div className="fr-info-item">
                                <Mail size={16} className="fr-info-icon" />
                                <span>{friend.email}</span>
                            </div>
                        )}
    
                        {friend.phone && (
                            <div className="fr-info-item">
                                <Phone size={16} className="fr-info-icon" />
                                <span>{friend.phone}</span>
                            </div>
                        )}
                    </div>
    
                    <div className="fr-info-section">
                        <h3 className="fr-info-section-title">Activity</h3>
    
                        <div className="fr-info-item">
                            <span className="fr-info-label">First expense:</span>
                            <span className="fr-info-value">
                                {formatDate(mockExpenses[mockExpenses.length - 1].date)}
                            </span>
                        </div>
    
                        <div className="fr-info-item">
                            <span className="fr-info-label">Latest expense:</span>
                            <span className="fr-info-value">
                                {formatDate(mockExpenses[0].date)}
                            </span>
                        </div>
    
                        <div className="fr-info-item">
                            <span className="fr-info-label">Total expenses:</span>
                            <span className="fr-info-value">{mockExpenses.length}</span>
                        </div>
                    </div>
    
                    <div className="fr-friend-actions">
                        <button className="fr-friend-action danger">
                            <AlertCircle size={16} />
                            <span>Remove Friend</span>
                        </button>
                    </div>
                </div>
            </TabsContent>
        </Tabs>
    </div>
);

export default FriendDetailsContent;
