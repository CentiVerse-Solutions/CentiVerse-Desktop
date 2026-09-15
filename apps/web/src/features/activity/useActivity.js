import React, { useState, useEffect, useMemo } from 'react';
import { useRecentExpenses, useGroups } from '../../data/hooks';
import { toLegacyExpenses } from '../../data/legacy';
import { formatAmount } from '../../shared/money/format';

/**
 * 7.4 -- Activity's data loading, filtering and derived views, lifted verbatim
 * so the page is left composing sections. Behaviour-preserving.
 */
export const useActivity = () => {
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


    return {
        expensesQuery,
        activities,
        allGroups,
        containerVariants,
        expandedItems,
        filterCategory,
        filterGroup,
        filterSettlement,
        filterType,
        filteredActivities,
        formatCurrency,
        formatDate,
        groupedActivities,
        handleSettle,
        itemVariants,
        searchQuery,
        setFilterCategory,
        setFilterGroup,
        setFilterSettlement,
        setFilterType,
        setSearchQuery,
        setShowFilters,
        showFilters,
        summary,
        toggleExpenseDetails,
        uniqueCategories,
    };
};
