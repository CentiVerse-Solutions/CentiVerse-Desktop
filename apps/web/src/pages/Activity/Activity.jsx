import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Filter,
    Search,
    Calendar,
    DollarSign,
    Users,
    Tag,
    ChevronDown,
    ChevronUp,
    User,
    CheckCircle,
    ArrowUpRight,
    ArrowDownLeft,
    ChevronRight
} from 'lucide-react';
import SearchBar from '../../components/common/SearchBar/SearchBar';
import { Button } from '../../components/common/Button/Button';
import { Avatar } from '../../components/common/Avatar/Avatar';
import { useRecentExpenses, useGroups } from '../../data/hooks';
import { toLegacyExpenses } from '../../data/legacy';
import { LoadingState, ErrorState } from '../../shared/ui/AsyncBoundary';
import './Activity.css';
import { formatAmount } from '../../shared/money/format';

const Activity = () => {
    const [activities, setActivities] = useState([]);
    const [filteredActivities, setFilteredActivities] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedItems, setExpandedItems] = useState({});
    const [filterType, setFilterType] = useState('all');
    const [filterGroup, setFilterGroup] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterSettlement, setFilterSettlement] = useState('all'); // 'all', 'pending', 'settled'
    const [showFilters, setShowFilters] = useState(false);
    const [summary, setSummary] = useState({
        youOwe: 0,
        youAreOwed: 0,
        netBalance: 0
    });

    // Current user ID (in a real app this would come from auth context)
    const currentUserId = 1; // Assuming user with ID 1 is "You"

    // §5.2: expenses and groups come from the seam.
    const expensesQuery = useRecentExpenses(500);
    const groupsQuery = useGroups();
    const allExpenses = useMemo(() => toLegacyExpenses(expensesQuery.data ?? []), [expensesQuery.data]);
    const allGroups = groupsQuery.data ?? [];

    // Get all expenses with group info, settlement status, and relevant to the current user
    useEffect(() => {
        // Process expenses to add settlement information
        // In a real app, this would come from your backend
        const enhancedExpenses = allExpenses.map(expense => {
            // Find the group this expense belongs to
            const group = expense.groupId ? allGroups.find(g => g.id === expense.groupId) : null;

            // Calculate settlement info
            const userIsPayer = expense.paidBy.id === currentUserId;
            const userIsParticipant = expense.participants.some(p => p.id === currentUserId);

            // Skip if user is not involved in this expense
            if (!userIsPayer && !userIsParticipant) {
                return null;
            }

            const perPersonAmount = expense.amount / expense.participants.length;
            let settlementType = '';
            let settlementAmount = 0;

            if (userIsPayer) {
                // User paid, so others owe them
                settlementType = 'youAreOwed';
                // Total amount minus user's share
                settlementAmount = expense.amount - perPersonAmount;
            } else {
                // User didn't pay, so they owe the payer
                settlementType = 'youOwe';
                settlementAmount = perPersonAmount;
            }

            // Random settlement status for demo purposes
            // In a real app, this would come from your backend
            const isSettled = Math.random() > 0.7;
            const settledDate = isSettled ?
                new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 14) : null;

            return {
                ...expense,
                group,
                type: 'expense',
                settlementType,
                settlementAmount,
                isSettled,
                settledDate,
                userInvolved: true
            };
        }).filter(expense => expense !== null); // Remove null entries (where user is not involved)

        // Calculate summary totals
        const youOwe = enhancedExpenses
            .filter(e => e.settlementType === 'youOwe' && !e.isSettled)
            .reduce((sum, e) => sum + e.settlementAmount, 0);

        const youAreOwed = enhancedExpenses
            .filter(e => e.settlementType === 'youAreOwed' && !e.isSettled)
            .reduce((sum, e) => sum + e.settlementAmount, 0);

        setSummary({
            youOwe,
            youAreOwed,
            netBalance: youAreOwed - youOwe
        });

        // Sort by date (newest first)
        const sortedActivities = enhancedExpenses.sort((a, b) =>
            new Date(b.date) - new Date(a.date)
        );

        setActivities(sortedActivities);
        setFilteredActivities(sortedActivities);
    }, [allExpenses, allGroups, currentUserId]);

    // Update filtered activities when filters change
    useEffect(() => {
        let result = [...activities];

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(activity =>
                activity.description.toLowerCase().includes(query) ||
                (activity.group && activity.group.name.toLowerCase().includes(query)) ||
                activity.paidBy?.name.toLowerCase().includes(query)
            );
        }

        // Apply type filter
        if (filterType !== 'all') {
            if (filterType === 'paid') {
                result = result.filter(activity =>
                    activity.paidBy.id === currentUserId
                );
            } else if (filterType === 'received') {
                result = result.filter(activity =>
                    activity.paidBy.id !== currentUserId &&
                    activity.participants.some(p => p.id === currentUserId)
                );
            }
        }

        // Apply group filter
        if (filterGroup !== 'all') {
            result = result.filter(activity =>
                activity.groupId === parseInt(filterGroup)
            );
        }

        // Apply category filter
        if (filterCategory !== 'all') {
            result = result.filter(activity =>
                activity.category.id === parseInt(filterCategory)
            );
        }

        // Apply settlement filter
        if (filterSettlement !== 'all') {
            if (filterSettlement === 'pending') {
                result = result.filter(activity => !activity.isSettled);
            } else if (filterSettlement === 'settled') {
                result = result.filter(activity => activity.isSettled);
            }
        }

        setFilteredActivities(result);
    }, [searchQuery, filterType, filterGroup, filterCategory, filterSettlement, activities]);

    // Toggle expense details expansion
    const toggleExpenseDetails = (expenseId) => {
        setExpandedItems(prev => ({
            ...prev,
            [expenseId]: !prev[expenseId]
        }));
    };

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

    // Handle settling an expense
    const handleSettle = (activityId) => {
        // In a real app, you'd call your API here
        setActivities(prev =>
            prev.map(activity =>
                activity.id === activityId
                    ? { ...activity, isSettled: true, settledDate: new Date() }
                    : activity
            )
        );
    };

    // Group activities by month and year
    const groupActivitiesByDate = () => {
        const groupedActivities = {};

        filteredActivities.forEach(activity => {
            const date = new Date(activity.date);
            const monthYear = date.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric'
            });

            if (!groupedActivities[monthYear]) {
                groupedActivities[monthYear] = [];
            }

            groupedActivities[monthYear].push(activity);
        });

        return groupedActivities;
    };

    // Get unique categories from all expenses
    const getUniqueCategories = () => {
        const categories = {};
        allExpenses.forEach(expense => {
            if (expense.category && !categories[expense.category.id]) {
                categories[expense.category.id] = expense.category;
            }
        });
        return Object.values(categories);
    };

    const groupedActivities = groupActivitiesByDate();
    const uniqueCategories = getUniqueCategories();

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
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
    if (expensesQuery.isPending) return <LoadingState label="Loading activity…" />;
    if (expensesQuery.isError) {
        return (
            <ErrorState
                error={expensesQuery.error}
                label="Could not load activity"
                onRetry={() => expensesQuery.refetch()}
            />
        );
    }

    return (
        <motion.div
            className="act-page"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div className="act-header" variants={itemVariants}>
                <h1 className="act-title">Activity</h1>

                <div className="act-controls">
                    <SearchBar
                        onSearch={setSearchQuery}
                        placeholder="Search activities..."
                        icon={<Search size={18} />}
                        className="act-search"
                    />

                    <Button
                        onClick={() => setShowFilters(!showFilters)}
                        className="act-filter-btn"
                        variant={showFilters ? "primary" : "outline"}
                        icon={<Filter size={18} />}
                    >
                        Filter
                    </Button>
                </div>
            </motion.div>

            {/* New Settlement Summary Section */}
            <motion.div
                className="act-settlement-summary"
                variants={itemVariants}
            >
                <div className="act-settlement-card outgoing">
                    <div className="act-settlement-icon">
                        <ArrowUpRight size={20} />
                    </div>
                    <div className="act-settlement-info">
                        <h3 className="act-settlement-label">You owe</h3>
                        <div className="act-settlement-amount">{formatCurrency(summary.youOwe)}</div>
                    </div>
                    <Button
                        variant="outline"
                        size="small"
                        className="act-view-btn"
                        icon={<ChevronRight size={16} />}
                    >
                        View
                    </Button>
                </div>

                <div className="act-settlement-card incoming">
                    <div className="act-settlement-icon">
                        <ArrowDownLeft size={20} />
                    </div>
                    <div className="act-settlement-info">
                        <h3 className="act-settlement-label">You are owed</h3>
                        <div className="act-settlement-amount">{formatCurrency(summary.youAreOwed)}</div>
                    </div>
                    <Button
                        variant="outline"
                        size="small"
                        className="act-view-btn"
                        icon={<ChevronRight size={16} />}
                    >
                        View
                    </Button>
                </div>

                <div className={`act-settlement-card balance ${summary.netBalance >= 0 ? 'positive' : 'negative'}`}>
                    <div className="act-settlement-info">
                        <h3 className="act-settlement-label">Net balance</h3>
                        <div className="act-settlement-amount">
                            {summary.netBalance >= 0 ? '+' : ''}{formatCurrency(summary.netBalance)}
                        </div>
                    </div>
                </div>
            </motion.div>

            {showFilters && (
                <motion.div
                    className="act-filter-container"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    variants={itemVariants}
                >
                    <div className="act-filter-section">
                        <div className="act-filter-label">
                            <User size={16} />
                            <span>Type</span>
                        </div>
                        <div className="act-filter-options">
                            <button
                                className={`act-filter-option ${filterType === 'all' ? 'active' : ''}`}
                                onClick={() => setFilterType('all')}
                            >
                                All
                            </button>
                            <button
                                className={`act-filter-option ${filterType === 'paid' ? 'active' : ''}`}
                                onClick={() => setFilterType('paid')}
                            >
                                Paid by you
                            </button>
                            <button
                                className={`act-filter-option ${filterType === 'received' ? 'active' : ''}`}
                                onClick={() => setFilterType('received')}
                            >
                                Paid by others
                            </button>
                        </div>
                    </div>

                    <div className="act-filter-section">
                        <div className="act-filter-label">
                            <Users size={16} />
                            <span>Group</span>
                        </div>
                        <div className="act-filter-options scrollable">
                            <button
                                className={`act-filter-option ${filterGroup === 'all' ? 'active' : ''}`}
                                onClick={() => setFilterGroup('all')}
                            >
                                All Groups
                            </button>
                            {allGroups.map(group => (
                                <button
                                    key={group.id}
                                    className={`act-filter-option ${filterGroup === group.id.toString() ? 'active' : ''}`}
                                    onClick={() => setFilterGroup(group.id.toString())}
                                >
                                    {group.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="act-filter-section">
                        <div className="act-filter-label">
                            <Tag size={16} />
                            <span>Category</span>
                        </div>
                        <div className="act-filter-options scrollable">
                            <button
                                className={`act-filter-option ${filterCategory === 'all' ? 'active' : ''}`}
                                onClick={() => setFilterCategory('all')}
                            >
                                All Categories
                            </button>
                            {uniqueCategories.map(category => (
                                <button
                                    key={category.id}
                                    className={`act-filter-option ${filterCategory === category.id.toString() ? 'active' : ''}`}
                                    onClick={() => setFilterCategory(category.id.toString())}
                                >
                                    {category.icon} {category.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* New Settlement Status Filter */}
                    <div className="act-filter-section">
                        <div className="act-filter-label">
                            <CheckCircle size={16} />
                            <span>Settlement Status</span>
                        </div>
                        <div className="act-filter-options">
                            <button
                                className={`act-filter-option ${filterSettlement === 'all' ? 'active' : ''}`}
                                onClick={() => setFilterSettlement('all')}
                            >
                                All
                            </button>
                            <button
                                className={`act-filter-option ${filterSettlement === 'pending' ? 'active' : ''}`}
                                onClick={() => setFilterSettlement('pending')}
                            >
                                Pending
                            </button>
                            <button
                                className={`act-filter-option ${filterSettlement === 'settled' ? 'active' : ''}`}
                                onClick={() => setFilterSettlement('settled')}
                            >
                                Settled
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            <div className="act-status">
                <p className="act-results-count">
                    {filteredActivities.length} {filteredActivities.length === 1 ? 'activity' : 'activities'} found
                    {(searchQuery || filterType !== 'all' || filterGroup !== 'all' || filterCategory !== 'all' || filterSettlement !== 'all') &&
                        ' with current filters'}
                </p>

                {(searchQuery || filterType !== 'all' || filterGroup !== 'all' || filterCategory !== 'all' || filterSettlement !== 'all') && (
                    <button
                        className="act-clear-filters"
                        onClick={() => {
                            setSearchQuery('');
                            setFilterType('all');
                            setFilterGroup('all');
                            setFilterCategory('all');
                            setFilterSettlement('all');
                        }}
                    >
                        Clear all filters
                    </button>
                )}
            </div>

            <motion.div className="act-timeline" variants={itemVariants}>
                {Object.keys(groupedActivities).length > 0 ? (
                    Object.entries(groupedActivities).map(([monthYear, monthActivities]) => (
                        <div key={monthYear} className="act-timeline-month">
                            <div className="act-month-header">
                                <h2 className="act-month-label">{monthYear}</h2>
                                <div className="act-month-line"></div>
                            </div>

                            <div className="act-month-activities">
                                {monthActivities.map(activity => (
                                    <motion.div
                                        key={activity.id}
                                        className="act-item"
                                        variants={itemVariants}
                                        whileHover={{ scale: 1.01 }}
                                    >
                                        <div
                                            className={`act-card ${activity.isSettled ? 'settled' : ''} ${activity.settlementType}`}
                                            onClick={() => toggleExpenseDetails(activity.id)}
                                        >
                                            <div className="act-date">
                                                <div className="act-date-circle">
                                                    <span className="act-date-day">
                                                        {new Date(activity.date).getDate()}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="act-main">
                                                <div className="act-card-header">
                                                    <div className="act-basic-info">
                                                        <div className="act-title-row">
                                                            <h3 className="act-description">
                                                                {activity.description}
                                                            </h3>
                                                            {activity.isSettled ? (
                                                                <span className="act-status-tag settled">
                                                                    <CheckCircle size={12} />
                                                                    Settled
                                                                </span>
                                                            ) : (
                                                                <span className="act-status-tag pending">
                                                                    Pending
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="act-meta">
                                                            {activity.group ? (
                                                                <span className="act-group">
                                                                    {activity.group.name}
                                                                </span>
                                                            ) : (
                                                                <span className="act-group">Personal</span>
                                                            )}
                                                            <span className="act-category">
                                                                {activity.category.icon} {activity.category.name}
                                                            </span>
                                                        </span>
                                                    </div>

                                                    <div className="act-amount-container">
                                                        <div className={`act-settlement-indicator ${activity.settlementType}`}>
                                                            {activity.settlementType === 'youOwe' ? (
                                                                <>
                                                                    <ArrowUpRight size={14} />
                                                                    <span>You owe</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ArrowDownLeft size={14} />
                                                                    <span>Owes you</span>
                                                                </>
                                                            )}
                                                        </div>
                                                        <span className="act-amount">
                                                            {formatCurrency(activity.amount)}
                                                        </span>
                                                        <span className="act-settlement-amount">
                                                            Your share: {formatCurrency(activity.settlementAmount)}
                                                        </span>
                                                        <span className="act-time">
                                                            {activity.isSettled
                                                                ? `Settled ${formatDate(activity.settledDate)}`
                                                                : formatDate(activity.date)}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="act-summary">
                                                    <div className="act-paid-by">
                                                        <Avatar
                                                            src={activity.paidBy.avatar}
                                                            alt={activity.paidBy.name}
                                                            size="small"
                                                        />
                                                        <span>
                                                            {activity.paidBy.name} paid
                                                        </span>
                                                    </div>

                                                    <div className="act-participants">
                                                        <div className="act-participant-avatars">
                                                            {activity.participants.slice(0, 3).map(participant => (
                                                                <Avatar
                                                                    key={participant.id}
                                                                    src={participant.avatar}
                                                                    alt={participant.name}
                                                                    size="xsmall"
                                                                />
                                                            ))}
                                                            {activity.participants.length > 3 && (
                                                                <div className="act-avatar-more">
                                                                    +{activity.participants.length - 3}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <button className="act-expander">
                                                        {expandedItems[activity.id]
                                                            ? <ChevronUp size={18} />
                                                            : <ChevronDown size={18} />
                                                        }
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {expandedItems[activity.id] && (
                                            <motion.div
                                                className="act-details"
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <div className="act-details-section">
                                                    <h4 className="act-details-title">Participants</h4>
                                                    <div className="act-participants-list">
                                                        {activity.participants.map(participant => (
                                                            <div key={participant.id} className="act-participant-item">
                                                                <Avatar
                                                                    src={participant.avatar}
                                                                    alt={participant.name}
                                                                    size="small"
                                                                />
                                                                <span className="act-participant-name">
                                                                    {participant.name}
                                                                </span>
                                                                <span className="act-participant-share">
                                                                    {formatCurrency(activity.amount / activity.participants.length)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="act-details-section">
                                                    <h4 className="act-details-title">Settlement Details</h4>
                                                    <div className="act-details-grid">
                                                        <div className="act-detail-item">
                                                            <span className="act-detail-label">Status</span>
                                                            <span className={`act-detail-value ${activity.isSettled ? 'settled-text' : 'pending-text'}`}>
                                                                {activity.isSettled ? 'Settled' : 'Pending settlement'}
                                                            </span>
                                                        </div>

                                                        {activity.isSettled && (
                                                            <div className="act-detail-item">
                                                                <span className="act-detail-label">Settled On</span>
                                                                <span className="act-detail-value">
                                                                    {new Date(activity.settledDate).toLocaleDateString('en-US', {
                                                                        month: 'long',
                                                                        day: 'numeric',
                                                                        year: 'numeric'
                                                                    })}
                                                                </span>
                                                            </div>
                                                        )}

                                                        <div className="act-detail-item">
                                                            <span className="act-detail-label">Total Amount</span>
                                                            <span className="act-detail-value">
                                                                {formatCurrency(activity.amount)}
                                                            </span>
                                                        </div>

                                                        <div className="act-detail-item">
                                                            <span className="act-detail-label">Your Share</span>
                                                            <span className="act-detail-value">
                                                                {formatCurrency(activity.amount / activity.participants.length)}
                                                            </span>
                                                        </div>

                                                        <div className="act-detail-item">
                                                            <span className="act-detail-label">Settlement</span>
                                                            <span className="act-detail-value">
                                                                {activity.settlementType === 'youOwe' ? (
                                                                    <span className="act-owe-text">You owe {activity.paidBy.name}</span>
                                                                ) : (
                                                                    <span className="act-owed-text">Others owe you</span>
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="act-details-section">
                                                    <h4 className="act-details-title">Expense Details</h4>
                                                    <div className="act-details-grid">
                                                        <div className="act-detail-item">
                                                            <span className="act-detail-label">Date</span>
                                                            <span className="act-detail-value">
                                                                {new Date(activity.date).toLocaleDateString('en-US', {
                                                                    month: 'long',
                                                                    day: 'numeric',
                                                                    year: 'numeric'
                                                                })}
                                                            </span>
                                                        </div>

                                                        <div className="act-detail-item">
                                                            <span className="act-detail-label">Group</span>
                                                            {activity.group ? (
                                                                <Link to={`/groups/${activity.groupId}`} className="act-detail-value link">
                                                                    {activity.group.name}
                                                                </Link>
                                                            ) : (
                                                                <span className="act-detail-value">Personal</span>
                                                            )}
                                                        </div>

                                                        <div className="act-detail-item">
                                                            <span className="act-detail-label">Category</span>
                                                            <span className="act-detail-value">
                                                                {activity.category.icon} {activity.category.name}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="act-details-actions">
                                                    {!activity.isSettled && (
                                                        <Button
                                                            variant="primary"
                                                            className="act-details-btn"
                                                            icon={<DollarSign size={16} />}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSettle(activity.id);
                                                            }}
                                                        >
                                                            {activity.settlementType === 'youOwe'
                                                                ? 'Mark as Paid'
                                                                : 'Mark as Received'}
                                                        </Button>
                                                    )}

                                                    <Button
                                                        variant={activity.isSettled ? "primary" : "outline"}
                                                        className="act-details-btn"
                                                    >
                                                        View Full Details
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="act-no-results">
                        <p>No activities found matching your criteria.</p>
                        {(searchQuery || filterType !== 'all' || filterGroup !== 'all' || filterCategory !== 'all' || filterSettlement !== 'all') && (
                            <Button onClick={() => {
                                setSearchQuery('');
                                setFilterType('all');
                                setFilterGroup('all');
                                setFilterCategory('all');
                                setFilterSettlement('all');
                            }}>
                                Clear Filters
                            </Button>
                        )}
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

export default Activity;