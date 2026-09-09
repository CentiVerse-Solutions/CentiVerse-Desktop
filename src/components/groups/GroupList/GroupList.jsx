import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Search, Users, Plus, Filter, ArrowUpDown, Grid, List, X, Clock, Calendar, ChevronsUp, Tag, Check } from 'lucide-react';
import GroupCard from '../GroupCard/GroupCard';
import NewGroupModal from '../NewGroupModal/NewGroupModal';
import './GroupList.css';

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
                <div className="group-list-controls">
                    <motion.div
                        className="search-filter-container"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="search-wrapper">
                            <Search className="search-icon" size={18} />
                            <input
                                type="text"
                                placeholder="Search groups..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                            <AnimatePresence>
                                {searchQuery && (
                                    <motion.button
                                        className="clear-search"
                                        onClick={() => setSearchQuery('')}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <X size={16} />
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>

                        <motion.button
                            className={`filter-button ${showFilters ? 'active' : ''} ${filterApplied ? 'has-filters' : ''}`}
                            onClick={toggleFilters}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            animate={filterApplied ? { boxShadow: "0 0 0 2px rgba(34, 197, 94, 0.4)" } : {}}
                        >
                            <Filter size={18} />
                            <span>Filters</span>
                            {filterApplied && <span className="filter-indicator"></span>}
                        </motion.button>

                        <div className="view-toggle">
                            <motion.button
                                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                onClick={() => setViewMode('grid')}
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <Grid size={18} />
                            </motion.button>
                            <motion.button
                                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                                onClick={() => setViewMode('list')}
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <List size={18} />
                            </motion.button>
                        </div>

                        <motion.button
                            className="create-group-button"
                            onClick={openCreateGroupModal}
                            whileHover={{ y: -2, boxShadow: "0 8px 20px rgba(34, 197, 94, 0.3)" }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Plus size={18} />
                            <span>New Group</span>
                        </motion.button>
                    </motion.div>

                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                className="filters-panel"
                                variants={filterVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                layout
                            >
                                <div className="filters-section">
                                    <div className="filter-header">
                                        <h3>Sort By</h3>
                                        {sortBy !== 'recent' && (
                                            <motion.button
                                                className="reset-filter"
                                                onClick={() => setSortBy('recent')}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                Reset
                                            </motion.button>
                                        )}
                                    </div>
                                    <div className="filter-options">
                                        {sortOptions.map((option, index) => (
                                            <motion.button
                                                key={option.id}
                                                className={`filter-option ${sortBy === option.id ? 'active' : ''}`}
                                                onClick={() => setSortBy(option.id)}
                                                custom={index}
                                                variants={filterOptionVariants}
                                                initial="hidden"
                                                animate="visible"
                                                whileHover={{ scale: 1.03, backgroundColor: sortBy === option.id ? undefined : 'rgba(34, 197, 94, 0.08)' }}
                                                whileTap={{ scale: 0.97 }}
                                            >
                                                {option.icon}
                                                <span>{option.label}</span>
                                                {sortBy === option.id && <Check size={16} className="check-icon" />}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                <div className="filters-section">
                                    <div className="filter-header">
                                        <h3>Filter By</h3>
                                        {filterBy !== 'all' && (
                                            <motion.button
                                                className="reset-filter"
                                                onClick={() => setFilterBy('all')}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                Reset
                                            </motion.button>
                                        )}
                                    </div>
                                    <div className="filter-options">
                                        {filterOptions.map((option, index) => (
                                            <motion.button
                                                key={option.id}
                                                className={`filter-option ${filterBy === option.id ? 'active' : ''}`}
                                                onClick={() => setFilterBy(option.id)}
                                                custom={index}
                                                variants={filterOptionVariants}
                                                initial="hidden"
                                                animate="visible"
                                                whileHover={{ scale: 1.03, backgroundColor: filterBy === option.id ? undefined : 'rgba(34, 197, 94, 0.08)' }}
                                                whileTap={{ scale: 0.97 }}
                                            >
                                                <span>{option.label}</span>
                                                {filterBy === option.id && <Check size={16} className="check-icon" />}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {filterApplied && (
                                    <motion.button
                                        className="clear-all-filters"
                                        onClick={clearFilters}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        whileHover={{ scale: 1.05, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)" }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <X size={16} />
                                        Clear All Filters
                                    </motion.button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {filteredGroups.length > 0 && (
                        <motion.div
                            className="results-summary"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <p>
                                <span className="count">{filteredGroups.length}</span> {filteredGroups.length === 1 ? 'group' : 'groups'} found
                                {searchQuery && <span className="search-term"> for "<span>{searchQuery}</span>"</span>}
                                {filterBy !== 'all' && <span className="filter-label">{filterOptions.find(opt => opt.id === filterBy)?.label}</span>}
                            </p>

                            {filterApplied && (
                                <motion.button
                                    className="clear-filters-btn"
                                    onClick={clearFilters}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <X size={16} />
                                    Clear
                                </motion.button>
                            )}
                        </motion.div>
                    )}
                </div>

                <motion.div
                    className={`group-list ${viewMode === 'list' ? 'list-view' : 'grid-view'}`}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    layout
                >
                    <AnimatePresence mode="wait">
                        {filteredGroups.length > 0 ? (
                            <>
                                {filteredGroups.map((group, index) => (
                                    <motion.div
                                        key={group.id}
                                        className="group-card-wrapper"
                                        variants={itemVariants}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{
                                            opacity: 1,
                                            y: 0,
                                            transition: {
                                                delay: index * 0.05,
                                                type: "spring",
                                                stiffness: 300,
                                                damping: 25
                                            }
                                        }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        whileHover={{
                                            y: -5,
                                            boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)",
                                            transition: { duration: 0.2 }
                                        }}
                                    >
                                        <GroupCard
                                            group={group}
                                            expenses={expenses.filter(expense => expense.groupId === group.id)}
                                            currentUserId={currentUserId}
                                            viewMode={viewMode}
                                        />
                                    </motion.div>
                                ))}
                            </>
                        ) : (
                            <motion.div
                                className="empty-results"
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                <motion.div
                                    className="empty-icon"
                                    animate={{
                                        y: [0, -15, 0],
                                        transition: {
                                            repeat: Infinity,
                                            duration: 2,
                                            repeatType: "reverse"
                                        }
                                    }}
                                >
                                    <Users size={60} />
                                </motion.div>
                                <h3>No groups found</h3>
                                {filterApplied ? (
                                    <>
                                        <p>Try adjusting your search or filters</p>
                                        <motion.button
                                            className="action-button"
                                            onClick={clearFilters}
                                            whileHover={{ y: -3, boxShadow: "0 8px 20px rgba(34, 197, 94, 0.3)" }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <X size={18} />
                                            <span>Clear Filters</span>
                                        </motion.button>
                                    </>
                                ) : (
                                    <>
                                        <p>Create your first group to get started</p>
                                        <motion.button
                                            className="action-button create"
                                            onClick={openCreateGroupModal}
                                            whileHover={{ y: -3, boxShadow: "0 8px 20px rgba(34, 197, 94, 0.3)" }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <Plus size={18} />
                                            <span>Create New Group</span>
                                        </motion.button>
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

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