import { motion, AnimatePresence } from 'framer-motion';
import { Check, Filter, Grid, List, Plus, Search, X } from 'lucide-react';

/**
 * 7.4 -- extracted from GroupList verbatim (behaviour-preserving).
 */
const GroupControls = ({
    clearFilters,
    filterApplied,
    filterBy,
    filterOptionVariants,
    filterOptions,
    filterVariants,
    filteredGroups,
    groups,
    openCreateGroupModal,
    searchQuery,
    setFilterBy,
    setSearchQuery,
    setSortBy,
    setViewMode,
    showFilters,
    sortBy,
    sortOptions,
    toggleFilters,
    viewMode,
}) => (
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
);

export default GroupControls;
