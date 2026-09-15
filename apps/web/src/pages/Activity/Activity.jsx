import { useActivity } from '../../features/activity/useActivity';
import { motion } from 'framer-motion';
import { LoadingState, ErrorState } from '../../shared/ui/AsyncBoundary';
import './Activity.css';
import ActivityHeader from '../../features/activity/components/ActivityHeader';
import SettlementSummary from '../../features/activity/components/SettlementSummary';
import ActivityFilters from '../../features/activity/components/ActivityFilters';
import ActivityStatus from '../../features/activity/components/ActivityStatus';
import ActivityTimeline from '../../features/activity/components/ActivityTimeline';

const Activity = () => {
    const {
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
        expensesQuery,
    } = useActivity();

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
            <ActivityHeader
                activities={activities}
                itemVariants={itemVariants}
                setSearchQuery={setSearchQuery}
                setShowFilters={setShowFilters}
                showFilters={showFilters}
            />

            <SettlementSummary
                formatCurrency={formatCurrency}
                itemVariants={itemVariants}
                summary={summary}
            />
            <ActivityFilters
                allGroups={allGroups}
                filterCategory={filterCategory}
                filterGroup={filterGroup}
                filterSettlement={filterSettlement}
                filterType={filterType}
                itemVariants={itemVariants}
                setFilterCategory={setFilterCategory}
                setFilterGroup={setFilterGroup}
                setFilterSettlement={setFilterSettlement}
                setFilterType={setFilterType}
                showFilters={showFilters}
                uniqueCategories={uniqueCategories}
            />
            <ActivityStatus
                activities={activities}
                filterCategory={filterCategory}
                filterGroup={filterGroup}
                filterSettlement={filterSettlement}
                filterType={filterType}
                filteredActivities={filteredActivities}
                searchQuery={searchQuery}
                setFilterCategory={setFilterCategory}
                setFilterGroup={setFilterGroup}
                setFilterSettlement={setFilterSettlement}
                setFilterType={setFilterType}
                setSearchQuery={setSearchQuery}
            />

            <ActivityTimeline
                activities={activities}
                expandedItems={expandedItems}
                filterCategory={filterCategory}
                filterGroup={filterGroup}
                filterSettlement={filterSettlement}
                filterType={filterType}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                groupedActivities={groupedActivities}
                handleSettle={handleSettle}
                itemVariants={itemVariants}
                searchQuery={searchQuery}
                setFilterCategory={setFilterCategory}
                setFilterGroup={setFilterGroup}
                setFilterSettlement={setFilterSettlement}
                setFilterType={setFilterType}
                setSearchQuery={setSearchQuery}
                summary={summary}
                toggleExpenseDetails={toggleExpenseDetails}
            />
        </motion.div>
    );
};

export default Activity;