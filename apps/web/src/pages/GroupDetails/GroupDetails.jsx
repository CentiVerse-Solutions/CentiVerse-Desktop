import { motion, AnimatePresence } from 'framer-motion';
import { useGroupDetails } from '../../features/groups/useGroupDetails';
import { GroupLoadingView, GroupErrorView, GroupNotFoundView } from '../../features/groups/components/GroupDetailsViews';
import GroupExport from '../../components/groups/GroupExport/GroupExport';
import WhiteboardTab from '../../features/groups/components/tabs/WhiteboardTab';
import MembersTab from '../../features/groups/components/tabs/MembersTab';
import BalancesTab from '../../features/balances/components/BalancesTab';
import TotalsTab from '../../features/groups/components/tabs/TotalsTab';
import ExpenseFilters from '../../features/expenses/components/ExpenseFilters';
import ExpensesTab from '../../features/expenses/components/ExpensesTab';
import GroupTabs from '../../features/groups/components/GroupTabs';
import GroupHeader from '../../features/groups/components/GroupHeader';
import QuickAddExpense from '../../features/expenses/components/QuickAddExpense';
import ConfirmDialog from '../../features/groups/components/ConfirmDialog';
import ExpenseSplitEditor from '../../features/expenses/components/ExpenseSplitEditor';
import './GroupDetails.css';

const GroupDetails = () => {
    const {
        activeTab,
        balances,
        balancesQuery,
        cardVariants,
        categoryTotals,
        containerVariants,
        error,
        expenseFilter,
        expenseForm,
        expenses,
        expensesQuery,
        filteredExpenses,
        formErrors,
        formatCurrency,
        group,
        groupQuery,
        handleAmountChange,
        handleCancelConfirm,
        handleConfirmAction,
        handleExpenseFormChange,
        handleParticipantChange,
        handleRemoveMember,
        handleSaveExpense,
        handleSettleUp,
        handleSplitValueChange,
        hoveredExpense,
        isConfirmDialogOpen,
        isLoading,
        isQuickAddOpen,
        itemVariants,
        memberToRemove,
        monthlyTotals,
        myExpenses,
        navigate,
        pageVariants,
        setActiveTab,
        setExpenseFilter,
        setHoveredExpense,
        setShowExportModal,
        setSortBy,
        setTimePeriod,
        showExportModal,
        showSidebar,
        sortBy,
        splitValues,
        timePeriod,
        toggleQuickAdd,
        totalExpenses,
    } = useGroupDetails();

    if (isLoading) return <GroupLoadingView />;

    if (error) {
        return (
            <GroupErrorView
                error={error}
                onRetry={() => { groupQuery.refetch(); expensesQuery.refetch(); balancesQuery.refetch(); }}
            />
        );
    }

    if (!group) return <GroupNotFoundView onBack={() => navigate('/groups')} />;


    return (
        <motion.div
            className={`group-details-page ${showSidebar ? '' : 'sidebar-collapsed'}`}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
        >
            {/* Main Content */}
            <motion.div
                className="main-content"
                variants={itemVariants}
            >
                <GroupHeader
                    group={group}
                    expenses={expenses}
                    balances={balances}
                    totalExpenses={totalExpenses}
                    myExpenses={myExpenses}
                    formatCurrency={formatCurrency}
                    toggleQuickAdd={toggleQuickAdd}
                    setShowExportModal={setShowExportModal}
                    itemVariants={itemVariants}
                    cardVariants={cardVariants}
                    containerVariants={containerVariants}
                />

                {/* Tabs Navigation */}
                <GroupTabs
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                />

                {/* Filter Controls */}
                {activeTab === 'expenses' && (
                    <ExpenseFilters
                        group={group}
                        expenses={expenses}
                        expenseFilter={expenseFilter}
                        setExpenseFilter={setExpenseFilter}
                        timePeriod={timePeriod}
                        setTimePeriod={setTimePeriod}
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                    />
                )}

                {/* Tab Content */}
                <div className="tab-content">
                    {/* Expenses Tab */}
                    {activeTab === 'expenses' && (
                        <ExpensesTab
                            group={group}
                            filteredExpenses={filteredExpenses}
                            formatCurrency={formatCurrency}
                            hoveredExpense={hoveredExpense}
                            setHoveredExpense={setHoveredExpense}
                            toggleQuickAdd={toggleQuickAdd}
                            containerVariants={containerVariants}
                            cardVariants={cardVariants}
                        />
                    )}

                    {activeTab === 'balances' && (
                        <BalancesTab
                            balances={balances}
                            formatCurrency={formatCurrency}
                            handleSettleUp={handleSettleUp}
                            containerVariants={containerVariants}
                            cardVariants={cardVariants}
                        />
                    )}

                    {activeTab === 'totals' && (
                        <TotalsTab
                            group={group}
                            expenses={expenses}
                            totalExpenses={totalExpenses}
                            categoryTotals={categoryTotals}
                            monthlyTotals={monthlyTotals}
                            formatCurrency={formatCurrency}
                            containerVariants={containerVariants}
                            cardVariants={cardVariants}
                        />
                    )}

                    {activeTab === 'members' && (
                        <MembersTab
                            group={group}
                            expenses={expenses}
                            formatCurrency={formatCurrency}
                            handleSettleUp={handleSettleUp}
                            handleRemoveMember={handleRemoveMember}
                            containerVariants={containerVariants}
                            cardVariants={cardVariants}
                        />
                    )}

                    {activeTab === 'whiteboard' && <WhiteboardTab groupId={group.id} />}
                </div>

                {/* Enhanced Quick Add Expense Modal with modern styling and animations */}
                <AnimatePresence>
                    {isQuickAddOpen && (
                        <QuickAddExpense
                            group={group}
                            expenseForm={expenseForm}
                            formErrors={formErrors}
                            handleExpenseFormChange={handleExpenseFormChange}
                            handleAmountChange={handleAmountChange}
                            handleParticipantChange={handleParticipantChange}
                            handleSaveExpense={handleSaveExpense}
                            toggleQuickAdd={toggleQuickAdd}
                            splitEditor={
                                <ExpenseSplitEditor
                                    group={group}
                                    expenseForm={expenseForm}
                                    splitValues={splitValues}
                                    formErrors={formErrors}
                                    formatCurrency={formatCurrency}
                                    handleSplitValueChange={handleSplitValueChange}
                                />
                            }
                        />
                    )}
                </AnimatePresence>

                {/* Confirmation Dialog */}
                <AnimatePresence>
                    {isConfirmDialogOpen && (
                        <ConfirmDialog
                            group={group}
                            memberToRemove={memberToRemove}
                            handleConfirmAction={handleConfirmAction}
                            handleCancelConfirm={handleCancelConfirm}
                        />
                    )}
                </AnimatePresence>
            </motion.div>
            {/* Export Modal */}
            <GroupExport
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                group={group}
                expenses={expenses}
                members={group.members}
                balances={balances}
            />
        </motion.div>
    );
};

export default GroupDetails;
