import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Search, Users, Plus, Filter, ArrowUpDown, Grid, List, X, Clock, Calendar, ChevronsUp, Tag, Check } from 'lucide-react';
import GroupCard from '../GroupCard/GroupCard';
import NewGroupModal from '../NewGroupModal/NewGroupModal';
import './GroupList.css';
import GroupControls from '../../../features/groups/components/GroupControls';
import GroupGrid from '../../../features/groups/components/GroupGrid';

const GroupList = ({ groups = [], expenses = [], friends = [], onCreateGroup, viewMode: parentViewMode, searchTerm: parentSearchTerm }) => {
    const [searchQuery, setSearchQuery] = useState(parentSearchTerm || '');
    const [filteredGroups, setFilteredGroups] = useState(groups);
    const [sortBy, setSortBy] = useState('recent');
    const [filterBy, setFilterBy] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [viewMode, setViewMode] = useState(parentViewMode || 'grid'); // 'grid' or 'list'
    const [showFilters, setShowFilters] = useState(false);
    const [isFilterAnimating, setIsFilterAnimating] = useState(false);
    const [filterApplied, setFilterApplied] = useState(false);

    // Current user ID (in a real app this would come from auth context)
    const currentUserId = 1;

    // Sync with parent props if provided
    useEffect(() => {
        if (parentViewMode) setViewMode(parentViewMode);
        if (parentSearchTerm) setSearchQuery(parentSearchTerm);
    }, [parentViewMode, parentSearchTerm]);

    // Apply filters and sorting
    useEffect(() => {
        let result = [...groups];
        let hasFilters = searchQuery || filterBy !== 'all';

        // Apply search filter
        if (searchQuery) {
            result = result.filter(group =>
                group.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply category filter
        if (filterBy === 'created') {
            result = result.filter(group => group.createdBy === currentUserId);
        } else if (filterBy === 'joined') {
            result = result.filter(group => group.createdBy !== currentUserId);
        } else if (filterBy === 'active') {
            // Show groups with activity in the last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            result = result.filter(group => {
                const latestExpense = expenses
                    .filter(expense => expense.groupId === group.id)
                    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

                return latestExpense && new Date(latestExpense.date) >= thirtyDaysAgo;
            });
        }

        // Apply sorting
        if (sortBy === 'recent') {
            // Sort by most recent activity
            result.sort((a, b) => {
                const aLatestExpense = expenses
                    .filter(expense => expense.groupId === a.id)
                    .sort((x, y) => new Date(y.date) - new Date(x.date))[0];

                const bLatestExpense = expenses
                    .filter(expense => expense.groupId === b.id)
                    .sort((x, y) => new Date(y.date) - new Date(x.date))[0];

                const aDate = aLatestExpense ? new Date(aLatestExpense.date) : new Date(a.createdAt);
                const bDate = bLatestExpense ? new Date(bLatestExpense.date) : new Date(b.createdAt);

                return bDate - aDate;
            });
        } else if (sortBy === 'name') {
            // Sort alphabetically by name
            result.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortBy === 'amount') {
            // Sort by total amount spent
            result.sort((a, b) => {
                const aTotal = expenses
                    .filter(expense => expense.groupId === a.id)
                    .reduce((sum, expense) => sum + expense.amount, 0);

                const bTotal = expenses
                    .filter(expense => expense.groupId === b.id)
                    .reduce((sum, expense) => sum + expense.amount, 0);

                return bTotal - aTotal;
            });
        } else if (sortBy === 'members') {
            // Sort by number of members
            result.sort((a, b) => b.members.length - a.members.length);
        }

        setFilteredGroups(result);
        setFilterApplied(hasFilters);
    }, [groups, expenses, searchQuery, sortBy, filterBy, currentUserId]);

    // Toggle filters panel with animation coordination
    const toggleFilters = () => {
        if (!isFilterAnimating) {
            setIsFilterAnimating(true);
            setShowFilters(!showFilters);
            setTimeout(() => setIsFilterAnimating(false), 300); // Match with animation duration
        }
    };

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery('');
        setFilterBy('all');
        setSortBy('recent');
    };

    // Handle create group
    const handleCreateGroup = (groupData) => {
        closeCreateGroupModal();
        if (onCreateGroup) {
            onCreateGroup(groupData);
        }
    };

    // Open create group modal
    const openCreateGroupModal = () => {
        setShowModal(true);
    };

    // Close create group modal
    const closeCreateGroupModal = () => {
        setShowModal(false);
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 25
            }
        }
    };

    const filterVariants = {
        hidden: { opacity: 0, height: 0, overflow: 'hidden' },
        visible: {
            opacity: 1,
            height: 'auto',
            overflow: 'visible',
            transition: {
                height: {
                    duration: 0.3,
                    ease: "easeInOut"
                },
                opacity: {
                    duration: 0.2,
                    delay: 0.1
                }
            }
        },
        exit: {
            opacity: 0,
            height: 0,
            overflow: 'hidden',
            transition: {
                height: {
                    duration: 0.3,
                    ease: "easeInOut"
                },
                opacity: {
                    duration: 0.2
                }
            }
        }
    };

    const filterOptionVariants = {
        hidden: { opacity: 0, x: -10 },
        visible: i => ({
            opacity: 1,
            x: 0,
            transition: {
                delay: i * 0.05,
                duration: 0.2
            }
        })
    };

    const sortOptions = [
        { id: 'recent', label: 'Recent Activity', icon: <Clock size={16} /> },
        { id: 'name', label: 'Alphabetical', icon: <Tag size={16} /> },
        { id: 'amount', label: 'Total Amount', icon: <ChevronsUp size={16} /> },
        { id: 'members', label: 'Member Count', icon: <Users size={16} /> }
    ];

    const filterOptions = [
        { id: 'all', label: 'All Groups' },
        { id: 'created', label: 'Created by You' },
        { id: 'joined', label: 'Joined Groups' },
        { id: 'active', label: 'Active Recently' }
    ];

    return (
        <LayoutGroup>
            <motion.div className="group-list-container"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <GroupControls
                    clearFilters={clearFilters}
                    filterApplied={filterApplied}
                    filterBy={filterBy}
                    filterOptionVariants={filterOptionVariants}
                    filterOptions={filterOptions}
                    filterVariants={filterVariants}
                    filteredGroups={filteredGroups}
                    groups={groups}
                    openCreateGroupModal={openCreateGroupModal}
                    searchQuery={searchQuery}
                    setFilterBy={setFilterBy}
                    setSearchQuery={setSearchQuery}
                    setSortBy={setSortBy}
                    setViewMode={setViewMode}
                    showFilters={showFilters}
                    sortBy={sortBy}
                    sortOptions={sortOptions}
                    toggleFilters={toggleFilters}
                    viewMode={viewMode}
                />
                <GroupGrid
                    clearFilters={clearFilters}
                    containerVariants={containerVariants}
                    currentUserId={currentUserId}
                    expenses={expenses}
                    filterApplied={filterApplied}
                    filteredGroups={filteredGroups}
                    groups={groups}
                    itemVariants={itemVariants}
                    openCreateGroupModal={openCreateGroupModal}
                    viewMode={viewMode}
                />

                <AnimatePresence>
                    {showModal && (
                        <motion.div
                            className="modal-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={(e) => {
                                if (e.target === e.currentTarget) closeCreateGroupModal();
                            }}
                        >
                            <motion.div
                                className="modal-content"
                                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 50, scale: 0.9 }}
                                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <NewGroupModal
                                    isOpen
                                    onClose={closeCreateGroupModal}
                                    onCreateGroup={handleCreateGroup}
                                    friends={friends}
                                />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </LayoutGroup>
    );
};

export default GroupList;