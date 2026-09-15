import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, DollarSign, Clock, MoreHorizontal, ArrowUpRight, ArrowDownLeft, CheckCircle, Calendar, Share2, Eye } from 'lucide-react';
import GroupCardBody from '../../../features/groups/components/card/GroupCardBody';
import GroupCardFooter from '../../../features/groups/components/card/GroupCardFooter';
import './GroupCard.css';
import { formatAmount } from '../../../shared/money/format';

const GroupCard = ({ group, expenses = [], currentUserId }) => {
    const [isHovered, setIsHovered] = useState(false);

    // Calculate total spent in this group
    const totalSpent = expenses
        .filter(expense => expense.groupId === group.id)
        .reduce((sum, expense) => sum + expense.amount, 0);

    // Calculate user's contribution
    const userContribution = expenses
        .filter(expense => expense.groupId === group.id && expense.paidBy.id === currentUserId)
        .reduce((sum, expense) => sum + expense.amount, 0);

    // Calculate user's balance in this group
    let userBalance = 0;
    expenses
        .filter(expense => expense.groupId === group.id)
        .forEach(expense => {
            const userIsPayer = expense.paidBy.id === currentUserId;
            const userIsParticipant = expense.participants.some(p => p.id === currentUserId);
            const perPersonAmount = expense.amount / expense.participants.length;

            if (userIsPayer) {
                // User paid, so others owe them
                userBalance -= (expense.amount - perPersonAmount);
            } else if (userIsParticipant) {
                // User didn't pay, so they owe the payer
                userBalance += perPersonAmount;
            }
        });

    // Get last activity date
    const lastActivity = expenses
        .filter(expense => expense.groupId === group.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    // §4.1: the group's own currency, not a hardcoded USD.
    const formatCurrency = (amount) => formatAmount(amount, group?.currency ?? 'INR');

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'Never';

        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else if (diffDays < 30) {
            return `${Math.floor(diffDays / 7)} weeks ago`;
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
            });
        }
    };

    // Calculate activity status
    const getActivityStatus = () => {
        if (!lastActivity) return 'inactive';

        const date = new Date(lastActivity.date);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 3) return 'active';
        if (diffDays < 14) return 'recent';
        return 'inactive';
    };

    const activityStatus = getActivityStatus();

    // Card animation variants
    const cardVariants = {
        initial: { opacity: 0, y: 20 },
        animate: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 25
            }
        },
        hover: {
            y: -10,
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 25
            }
        },
        tap: { scale: 0.98 }
    };

    const balanceVariants = {
        initial: { scale: 0.9, opacity: 0 },
        animate: {
            scale: 1,
            opacity: 1,
            transition: { delay: 0.2, duration: 0.3 }
        }
    };

    const shimmerVariants = {
        initial: {
            x: '-100%',
            opacity: 0,
        },
        animate: {
            x: '100%',
            opacity: 0.2,
            transition: {
                repeat: Infinity,
                repeatType: 'mirror',
                duration: 1.5,
                ease: 'easeInOut',
            },
        },
    };

    return (
        <motion.div
            className={`group-card ${activityStatus}`}
            initial="initial"
            animate="animate"
            whileHover="hover"
            whileTap="tap"
            variants={cardVariants}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            layoutId={`group-card-${group.id}`}
        >
            <div className="card-background">
                <motion.div
                    className="card-shimmer"
                    variants={shimmerVariants}
                    initial="initial"
                    animate="animate"
                />
            </div>

            <div className="activity-indicator" />

            <Link to={`/groups/${group.id}`} className="group-card-link">
                <div className="group-card-header">
                    <div className="group-card-avatar">
                        <img src={group.avatar} alt={group.name} />
                        <motion.div
                            className="avatar-outline"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: isHovered ? 1.1 : 1, opacity: 1 }}
                            transition={{ duration: 0.4 }}
                        />
                    </div>

                    <div className="group-card-title">
                        <h3>{group.name}</h3>
                        <div className="group-card-members">
                            <Users size={14} />
                            <span>{group.members.length} members</span>
                            <motion.div
                                className="created-date"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
                            >
                                <Calendar size={12} />
                                <span>Created {new Date(group.createdAt).toLocaleDateString()}</span>
                            </motion.div>
                        </div>
                    </div>

                    <AnimatePresence>
                        {isHovered && (
                            <motion.div
                                className="card-actions"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <motion.button
                                    className="card-action-btn"
                                    whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.8)" }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Share2 size={16} />
                                </motion.button>
                                <motion.button
                                    className="card-action-btn primary"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Eye size={16} />
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <GroupCardBody
                    userBalance={userBalance}
                    activityStatus={activityStatus}
                    balanceVariants={balanceVariants}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                    group={group}
                    lastActivity={lastActivity}
                    totalSpent={totalSpent}
                />

                <GroupCardFooter
                    group={group}
                    isHovered={isHovered}
                />
            </Link>
        </motion.div>
    );
};

export default GroupCard;