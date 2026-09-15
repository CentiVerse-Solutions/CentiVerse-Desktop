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
import { Button } from '../../components/common/Button/Button';
import SearchBar from '../../components/common/SearchBar/SearchBar';
import { Avatar } from '../../components/common/Avatar/Avatar';
import { useViewerBalances, useRecentExpenses, useFriends, useGroups } from '../../data/hooks';
import { toLegacyExpenses, toLegacyFriends, toMajor } from '../../data/legacy';
import { LoadingState, ErrorState } from '../../shared/ui/AsyncBoundary';
import DashboardSidebar from '../../features/dashboard/components/DashboardSidebar';
import BalanceSummary from '../../features/dashboard/components/BalanceSummary';
import './Dashboard.css';
import { formatAmount } from '../../shared/money/format';

const Dashboard = () => {
    const [balanceSummary, setBalanceSummary] = useState({
        youOwe: 0,
        youAreOwed: 0,
        netBalance: 0,
    });

    const [recentActivities, setRecentActivities] = useState([]);
    const [topFriends, setTopFriends] = useState([]);

    // §5.2: every number here is derived from the ledger by @centiverse/core.
    // The old code summed mockFriends[].balance -- floats someone typed by hand
    // that never reconciled with mockExpenses.
    const balancesQuery = useViewerBalances();
    const expensesQuery = useRecentExpenses(5);
    const friendsQuery = useFriends();
    const groupsQuery = useGroups();

    const isPending =
        balancesQuery.isPending || expensesQuery.isPending || friendsQuery.isPending;
    const loadError =
        balancesQuery.error ?? expensesQuery.error ?? friendsQuery.error ?? null;

    useEffect(() => {
        const b = balancesQuery.data;
        if (!b) return;
        setBalanceSummary({
            youAreOwed: toMajor(b.youAreOwed.minor),
            youOwe: toMajor(b.youOwe.minor),
            netBalance: toMajor(b.net.minor),
        });
    }, [balancesQuery.data]);

    useEffect(() => {
        if (!expensesQuery.data) return;
        const groups = groupsQuery.data ?? [];
        setRecentActivities(
            toLegacyExpenses(expensesQuery.data).map((expense) => ({
                ...expense,
                group: expense.groupId ? groups.find((g) => g.id === expense.groupId) ?? null : null,
                type: 'expense',
            })),
        );
    }, [expensesQuery.data, groupsQuery.data]);

    useEffect(() => {
        if (!friendsQuery.data) return;
        setTopFriends(
            [...toLegacyFriends(friendsQuery.data)]
                .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
                .slice(0, 4),
        );
    }, [friendsQuery.data]);

    // Format currency
    // §4.1: currency comes from the data, never a hardcoded symbol.
    const formatCurrency = (amount) => formatAmount(amount);

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

    // Phase 3 exit criterion: real loading and error states on every screen.
    if (isPending) return <LoadingState label="Loading your dashboard…" />;
    if (loadError) {
        return (
            <ErrorState
                error={loadError}
                label="Could not load your dashboard"
                onRetry={() => { balancesQuery.refetch(); expensesQuery.refetch(); friendsQuery.refetch(); }}
            />
        );
    }

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

            <BalanceSummary
                balanceSummary={balanceSummary}
                formatCurrency={formatCurrency}
                itemVariants={itemVariants}
            />

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
                                                    {activity.group ? `In ${activity.group.name}` : 'Personal expense'}
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
                            {(groupsQuery.data ?? []).slice(0, 4).map((group) => (
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

                <DashboardSidebar
                    formatCurrency={formatCurrency}
                    itemVariants={itemVariants}
                    topFriends={topFriends}
                />
            </div>
        </motion.div>
    );
};

export default Dashboard;