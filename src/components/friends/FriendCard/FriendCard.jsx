import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Check, DollarSign, Receipt, AlertCircle } from 'lucide-react';
import {Avatar} from '../../common/Avatar/Avatar';
import './FriendCard.css';

const FriendCard = ({ friend, index }) => {
    const { name, email, avatar, balance, lastActivity } = friend;

    // Determine status and styling based on balance
    const getBalanceInfo = () => {
        if (balance === 0) {
            return {
                status: 'settled',
                icon: <Check size={18} />,
                text: 'All settled up',
                className: 'settled'
            };
        } else if (balance > 0) {
            return {
                status: 'owesYou',
                icon: <ArrowDownRight size={18} />,
                text: `Owes you $${balance.toFixed(2)}`,
                className: 'owes-you'
            };
        } else {
            return {
                status: 'youOwe',
                icon: <ArrowUpRight size={18} />,
                text: `You owe $${Math.abs(balance).toFixed(2)}`,
                className: 'you-owe'
            };
        }
    };

    const balanceInfo = getBalanceInfo();

    // Format the date for last activity
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Animation variants
    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 150,
                damping: 15,
                delay: index * 0.05
            }
        },
        hover: {
            y: -8,
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
            scale: 1.02,
            transition: {
                type: "spring",
                stiffness: 200,
                damping: 15
            }
        },
        tap: { scale: 0.98 }
    };

    const iconMotion = {
        owesYou: {
            animate: {
                y: [0, -3, 0],
                transition: {
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: Math.random() * 2 + 1
                }
            }
        },
        youOwe: {
            animate: {
                y: [0, 3, 0],
                transition: {
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: Math.random() * 2 + 1
                }
            }
        },
        settled: {
            animate: {
                scale: [1, 1.1, 1],
                transition: {
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: Math.random() * 2 + 2
                }
            }
        }
    };

    return (
        <motion.div
            className={`fr-card ${balanceInfo.className}`}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            whileTap="tap"
        >
            <div className="fr-card-content">
                <div className="fr-card-avatar">
                    <Avatar
                        src={avatar}
                        alt={name}
                        size="large"
                    />
                </div>

                <div className="fr-info">
                    <motion.h3
                        className="fr-name"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 + index * 0.05 }}
                    >
                        {name}
                    </motion.h3>
                    <motion.p
                        className="fr-email"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.8 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                    >
                        {email}
                    </motion.p>

                    <motion.div
                        className={`fr-balance-indicator ${balanceInfo.className}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 + index * 0.05 }}
                    >
                        <motion.div
                            variants={iconMotion[balanceInfo.status]}
                            animate="animate"
                        >
                            {balanceInfo.icon}
                        </motion.div>
                        <span>{balanceInfo.text}</span>
                    </motion.div>

                    {lastActivity && (
                        <motion.p
                            className="fr-last-activity"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.7 }}
                            transition={{ delay: 0.5 + index * 0.05 }}
                        >
                            Last activity: {formatDate(lastActivity)}
                        </motion.p>
                    )}
                </div>
            </div>

            <div className="fr-actions">
                <motion.button
                    className="fr-action-btn add-expense"
                    whileHover={{ backgroundColor: "rgba(105, 162, 151, 0.1)" }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Receipt size={16} />
                    <span>Add expense</span>
                </motion.button>

                <motion.button
                    className="fr-action-btn settle-up"
                    whileHover={{ backgroundColor: "rgba(76, 175, 80, 0.1)" }}
                    whileTap={{ scale: 0.95 }}
                >
                    <DollarSign size={16} />
                    <span>Settle up</span>
                </motion.button>

                <motion.button
                    className="fr-action-btn remind"
                    whileHover={{ backgroundColor: "rgba(255, 152, 0, 0.1)" }}
                    whileTap={{ scale: 0.95 }}
                >
                    <AlertCircle size={16} />
                    <span>Remind</span>
                </motion.button>
            </div>
        </motion.div>
    );
};

export default FriendCard;