/**
 * 7.4 -- extracted from Activity verbatim (behaviour-preserving).
 */
const ActivityStatus = ({
    activities,
    filterCategory,
    filterGroup,
    filterSettlement,
    filterType,
    filteredActivities,
    searchQuery,
    setFilterCategory,
    setFilterGroup,
    setFilterSettlement,
    setFilterType,
    setSearchQuery,
}) => (
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
);

export default ActivityStatus;
