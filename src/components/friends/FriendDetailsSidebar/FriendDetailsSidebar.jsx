import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { X, ArrowUpRight, ArrowDownRight, Check, DollarSign, Receipt, User, Mail, Phone, AlertCircle, MoreHorizontal, ChevronDown } from 'lucide-react';
import { Avatar } from '../../common/Avatar/Avatar';
import './FriendDetailsSidebar.css';

// Mock expense data (in a real app, this would come from your API)
const mockExpenses = [
    {
        id: 'exp1',
        description: 'Dinner at Olive Garden',
        amount: 65.50,
        paidBy: 'you',
        date: '2023-03-15T19:30:00',
        participants: ['you', 'friend'],
        split: {
            you: 32.75,
            friend: 32.75
        }
    },
    {
        id: 'exp2',
        description: 'Movie tickets',
        amount: 24.00,
        paidBy: 'friend',
        date: '2023-02-28T20:00:00',
        participants: ['you', 'friend'],
        split: {
            you: 12.00,
            friend: 12.00
        }
    },
    {
        id: 'exp3',
        description: 'Uber ride',
        amount: 18.75,
        paidBy: 'you',
        date: '2023-02-14T22:15:00',
        participants: ['you', 'friend'],
        split: {
            you: 9.38,
            friend: 9.38
        }
    }
];

const FriendDetailsSidebar = ({ friend, isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('expenses');
    const [expandedExpenses, setExpandedExpenses] = useState({});

    // Toggle expense details expansion
    const toggleExpenseDetails = (expenseId) => {
        setExpandedExpenses(prev => ({
            ...prev,
            [expenseId]: !prev[expenseId]
        }));
    };

    // Format the date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Format the time
    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Determine balance status and styling
    const getBalanceInfo = () => {
        if (friend.balance === 0) {
            return {
                status: 'settled',
                icon: <Check size={20} />,
                text: 'All settled up',
                className: 'settled'
            };
        } else if (friend.balance > 0) {
            return {
                status: 'owesYou',
                icon: <ArrowDownRight size={20} />,
                text: `${friend.name} owes you $${friend.balance.toFixed(2)}`,
                className: 'owes-you'
            };
        } else {
            return {
                status: 'youOwe',
                icon: <ArrowUpRight size={20} />,
                text: `You owe ${friend.name} $${Math.abs(friend.balance).toFixed(2)}`,
                className: 'you-owe'
            };
        }
    };

    const balanceInfo = getBalanceInfo();

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="fr-details-sidebar">
                <SheetHeader className="fr-details-header">
                    <SheetTitle className="fr-details-title">Friend Details</SheetTitle>
                </SheetHeader>

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
            </SheetContent>
        </Sheet>
    );
};

export default FriendDetailsSidebar;