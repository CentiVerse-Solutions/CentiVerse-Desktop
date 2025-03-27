import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Plus,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Users,
    Clock,
    ChevronRight,
    Receipt,
    ArrowUpRight,
    ArrowDownRight,
    Check
} from 'lucide-react';
import {Button} from '../../components/common/Button/Button';
import SearchBar from '../../components/common/SearchBar/SearchBar';
import {Avatar} from '../../components/common/Avatar/Avatar';
import { mockFriends, mockGroups, mockExpenses } from '../../utils/mockData';
import './Dashboard.css';

const Dashboard = () => {
    const [balanceSummary, setBalanceSummary] = useState({
        youOwe: 0,
        youAreOwed: 0,
        netBalance: 0,
    });

    const [recentActivities, setRecentActivities] = useState([]);
    const [topFriends, setTopFriends] = useState([]);

    // Calculate balances and recent activities
    useEffect(() => {
        // Calculate total balances
        const youAreOwed = mockFriends
            .filter(friend => friend.balance > 0)
            .reduce((sum, friend) => sum + friend.balance, 0);

        const youOwe = mockFriends
            .filter(friend => friend.balance < 0)
            .reduce((sum, friend) => sum + Math.abs(friend.balance), 0);

        setBalanceSummary({
            youAreOwed,
            youOwe,
            netBalance: youAreOwed - youOwe,
        });

        // Get recent activities (expenses)
        const activities = [...mockExpenses]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5)
            .map(expense => {
                // Find the group this expense belongs to
                const group = mockGroups.find(g => g.id === expense.groupId);
                return {
                    ...expense,
                    group,
                    type: 'expense',
                };
            });

        setRecentActivities(activities);

        // Get top friends (those with highest absolute balances)
        const sortedFriends = [...mockFriends]
            .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
            .slice(0, 4);

        setTopFriends(sortedFriends);
    }, []);

    // Format currency
    const formatCurrency = (amount) => {
        return `$${amount.toFixed(2)}`;
    };

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);

        // Check if it's today
        if (date.toDateString() === now.toDateString()) {
            return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }

        // Check if it's yesterday
        if (date.toDateString() === yesterday.toDateString()) {
            return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }

        // Otherwise return the full date
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        });
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 100, damping: 15 }
        }
    };

    return (
        <motion.div
            className="dashboard-container"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div className="dashboard-header" variants={itemVariants}>
                <h1 className="dashboard-title">Dashboard</h1>
                <Button
                    className="add-expense-btn"
                    variant="primary"
                    icon={<Plus size={18} />}
                >
                    Add Expense
                </Button>
            </motion.div>

            <motion.div className="balance-summary" variants={itemVariants}>
                <div className="balance-card net-balance">
                    <div className="balance-icon">
                        <DollarSign size={24} />
                    </div>
                    <div className="balance-details">
                        <h3 className="balance-title">Net Balance</h3>
                        <p className={`balance-amount ${balanceSummary.netBalance >= 0 ? 'positive' : 'negative'}`}>
                            {formatCurrency(balanceSummary.netBalance)}
                        </p>
                    </div>
                </div>

                <div className="balance-card you-are-owed">
                    <div className="balance-icon">
                        <TrendingDown size={24} />
                    </div>
                    <div className="balance-details">
                        <h3 className="balance-title">You Are Owed</h3>
                        <p className="balance-amount positive">
                            {formatCurrency(balanceSummary.youAreOwed)}
                        </p>
                    </div>
                </div>

                <div className="balance-card you-owe">
                    <div className="balance-icon">
                        <TrendingUp size={24} />
                    </div>
                    <div className="balance-details">
                        <h3 className="balance-title">You Owe</h3>
                        <p className="balance-amount negative">
                            {formatCurrency(balanceSummary.youOwe)}
                        </p>
                    </div>
                </div>
            </motion.div>

            <div className="dashboard-content">
                <div className="dashboard-main">
                    <motion.div className="recent-activity-section" variants={itemVariants}>
                        <div className="section-header">
                            <div className="section-title-container">
                                <div className="title-line"></div>
                                <h2 className="section-title">
                                    <Clock size={18} />
                                    RECENT ACTIVITY
                                </h2>
                                <div className="title-line"></div>
                            </div>
                            <Link to="/activity" className="view-all-link">
                                View All <ChevronRight size={16} />
                            </Link>
                        </div>

                        <div className="activity-list">
                            {recentActivities.length > 0 ? (
                                recentActivities.slice(0, 5).map((activity) => (
                                    <div key={activity.id} className="activity-item">
                                        <div className="activity-date">
                                            <span className="month">
                                                {new Date(activity.date).toLocaleDateString('en-US', { month: 'short' })}
                                            </span>
                                            <span className="day">
                                                {new Date(activity.date).getDate()}
                                            </span>
                                        </div>

                                        <div className="activity-details">
                                            <h4 className="activity-title">{activity.description}</h4>
                                            <div className="activity-info">
                                                <span className="activity-group">
                                                    In {activity.group.name}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="activity-amount">
                                            <span>{formatCurrency(activity.amount)}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="no-activity">No recent activity to show.</p>
                            )}
                        </div>
                    </motion.div>

                    <motion.div className="top-groups-section" variants={itemVariants}>
                        <div className="section-header">
                            <div className="section-title-container">
                                <div className="title-line"></div>
                                <h2 className="section-title">
                                    <Users size={18} />
                                    YOUR GROUPS
                                </h2>
                                <div className="title-line"></div>
                            </div>
                            <Link to="/groups" className="view-all-link">
                                View All <ChevronRight size={16} />
                            </Link>
                        </div>

                        <div className="groups-grid">
                            {mockGroups.slice(0, 4).map((group) => (
                                <Link to={`/groups/${group.id}`} key={group.id} className="group-card">
                                    <div className="group-avatar">
                                        <img src={group.avatar} alt={group.name} />
                                    </div>
                                    <h3 className="group-name">{group.name}</h3>
                                </Link>
                            ))}

                            <div className="add-group-card">
                                <div className="add-group-icon">
                                    <Plus size={24} />
                                </div>
                                <span>Create Group</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <div className="dashboard-sidebar">
                    <motion.div className="friends-balances-section" variants={itemVariants}>
                        <div className="section-header">
                            <div className="section-title-container">
                                <div className="title-line"></div>
                                <h2 className="section-title">
                                    <Users size={18} />
                                    FRIEND BALANCES
                                </h2>
                                <div className="title-line"></div>
                            </div>
                            <Link to="/friends" className="view-all-link">
                                View All <ChevronRight size={16} />
                            </Link>
                        </div>

                        <div className="dashboard-friends-list">
                            {topFriends.map((friend) => {
                                // Determine status based on balance
                                let status, icon;
                                if (friend.balance > 0) {
                                    status = 'owes-you';
                                    icon = <ArrowDownRight size={16} />;
                                } else if (friend.balance < 0) {
                                    status = 'you-owe';
                                    icon = <ArrowUpRight size={16} />;
                                } else {
                                    status = 'settled';
                                    icon = <Check size={16} />;
                                }

                                return (
                                    <div key={friend.id} className="dashboard-friend-item">
                                        <div className="dashboard-friend-info">
                                            <Avatar src={friend.avatar} alt={friend.name} size="medium" />
                                            <h4 className="dashboard-friend-name">{friend.name}</h4>
                                        </div>

                                        <div className={`dashboard-friend-balance ${status}`}>
                                            {icon}
                                            <span>
                                                {friend.balance === 0
                                                    ? 'Settled up'
                                                    : friend.balance > 0
                                                        ? `Owes you ${formatCurrency(friend.balance)}`
                                                        : `You owe ${formatCurrency(Math.abs(friend.balance))}`
                                                }
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>

                    <motion.div className="quick-add-section" variants={itemVariants}>
                        <h2 className="section-title">Quick Add</h2>
                        <div className="quick-actions">
                            <button className="quick-action-btn">
                                <Receipt size={20} />
                                <span>Add Expense</span>
                            </button>
                            <button className="quick-action-btn">
                                <DollarSign size={20} />
                                <span>Settle Up</span>
                            </button>
                            <button className="quick-action-btn">
                                <Users size={20} />
                                <span>Add Friend</span>
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

export default Dashboard;