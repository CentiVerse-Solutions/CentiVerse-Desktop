import { motion } from 'framer-motion';
import { CheckCircle, Tag, User, Users } from 'lucide-react';

/**
 * 7.4 -- extracted from Activity verbatim (behaviour-preserving).
 */
const ActivityFilters = ({
    allGroups,
    filterCategory,
    filterGroup,
    filterSettlement,
    filterType,
    itemVariants,
    setFilterCategory,
    setFilterGroup,
    setFilterSettlement,
    setFilterType,
    showFilters,
    uniqueCategories,
}) => (
    <>
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
    </>
);

export default ActivityFilters;
