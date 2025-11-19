import React, { useState, useEffect } from 'react';
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
    User
} from 'lucide-react';
import SearchBar from '../../components/common/SearchBar/SearchBar';
import {Button} from '../../components/common/Button/Button';
import {Avatar} from '../../components/common/Avatar/Avatar';
import { mockExpenses, mockGroups, mockFriends } from '../../utils/mockData';
import './Activity.css';

const Activity = () => {
    const [activities, setActivities] = useState([]);
    const [filteredActivities, setFilteredActivities] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedItems, setExpandedItems] = useState({});
    const [filterType, setFilterType] = useState('all');
    const [filterGroup, setFilterGroup] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [showFilters, setShowFilters] = useState(false);

    // Get all expenses with group info
    useEffect(() => {
        const processedExpenses = mockExpenses.map(expense => {
            // Find the group this expense belongs to
            const group = mockGroups.find(g => g.id === expense.groupId);

            return {
                ...expense,
                group,
                type: 'expense',
            };
        });

        // Sort by date (newest first)
        const sortedActivities = processedExpenses.sort((a, b) =>
            new Date(b.date) - new Date(a.date)
        );

        setActivities(sortedActivities);
        setFilteredActivities(sortedActivities);
    }, []);

    // Update filtered activities when filters change
    useEffect(() => {
        let result = [...activities];

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(activity =>
                activity.description.toLowerCase().includes(query) ||
                activity.group?.name.toLowerCase().includes(query) ||
                activity.paidBy?.name.toLowerCase().includes(query)
            );
        }

        // Apply type filter
        if (filterType !== 'all') {
            if (filterType === 'paid') {
                result = result.filter(activity =>
                    activity.paidBy.name === 'You'
                );
            } else if (filterType === 'received') {
                result = result.filter(activity =>
                    activity.paidBy.name !== 'You' &&
                    activity.participants.some(p => p.name === 'You')
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

        setFilteredActivities(result);
    }, [searchQuery, filterType, filterGroup, filterCategory, activities]);

    // Toggle expense details expansion
    const toggleExpenseDetails = (expenseId) => {
        setExpandedItems(prev => ({
            ...prev,
            [expenseId]: !prev[expenseId]
        }));
    };

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
        mockExpenses.forEach(expense => {
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
                            {mockGroups.map(group => (
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
                </motion.div>
            )}

            <div className="act-status">
                <p className="act-results-count">
                    {filteredActivities.length} {filteredActivities.length === 1 ? 'activity' : 'activities'} found
                    {(searchQuery || filterType !== 'all' || filterGroup !== 'all' || filterCategory !== 'all') &&
                        ' with current filters'}
                </p>

                {(searchQuery || filterType !== 'all' || filterGroup !== 'all' || filterCategory !== 'all') && (
                    <button
                        className="act-clear-filters"
                        onClick={() => {
                            setSearchQuery('');
                            setFilterType('all');
                            setFilterGroup('all');
                            setFilterCategory('all');
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
                                            className="act-card"
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
                                                        <h3 className="act-description">
                                                            {activity.description}
                                                        </h3>
                                                        <span className="act-meta">
                                                            <span className="act-group">
                                                                {activity.group.name}
                                                            </span>
                                                            <span className="act-category">
                                                                {activity.category.icon} {activity.category.name}
                                                            </span>
                                                        </span>
                                                    </div>

                                                    <div className="act-amount-container">
                                                        <span className="act-amount">
                                                            {formatCurrency(activity.amount)}
                                                        </span>
                                                        <span className="act-time">
                                                            {formatDate(activity.date)}
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
                                                    <h4 className="act-details-title">Details</h4>
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
                                                            <Link to={`/groups/${activity.groupId}`} className="act-detail-value link">
                                                                {activity.group.name}
                                                            </Link>
                                                        </div>

                                                        <div className="act-detail-item">
                                                            <span className="act-detail-label">Total Amount</span>
                                                            <span className="act-detail-value">
                                                                {formatCurrency(activity.amount)}
                                                            </span>
                                                        </div>

                                                        <div className="act-detail-item">
                                                            <span className="act-detail-label">Per Person</span>
                                                            <span className="act-detail-value">
                                                                {formatCurrency(activity.amount / activity.participants.length)}
                                                            </span>
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
                                                    <Button
                                                        variant="outline"
                                                        className="act-details-btn"
                                                        icon={<DollarSign size={16} />}
                                                    >
                                                        Settle
                                                    </Button>

                                                    <Button
                                                        variant="primary"
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
                        {(searchQuery || filterType !== 'all' || filterGroup !== 'all' || filterCategory !== 'all') && (
                            <Button onClick={() => {
                                setSearchQuery('');
                                setFilterType('all');
                                setFilterGroup('all');
                                setFilterCategory('all');
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