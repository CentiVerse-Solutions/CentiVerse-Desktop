import ActivityItem from './ActivityItem';
import { motion } from 'framer-motion';
import { Button } from '../../../components/common/Button/Button';

/**
 * 7.4 -- extracted from Activity verbatim (behaviour-preserving).
 */
const ActivityTimeline = ({
    activities,
    expandedItems,
    filterCategory,
    filterGroup,
    filterSettlement,
    filterType,
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
    summary,
    toggleExpenseDetails,
}) => (
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
                        <ActivityItem
                            key={activity.id}
                            activity={activity}
                            expandedItems={expandedItems}
                            formatCurrency={formatCurrency}
                            formatDate={formatDate}
                            handleSettle={handleSettle}
                            itemVariants={itemVariants}
                            summary={summary}
                            toggleExpenseDetails={toggleExpenseDetails}
                        />
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
);

export default ActivityTimeline;
