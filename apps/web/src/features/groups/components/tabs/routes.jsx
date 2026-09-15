import { lazy } from 'react';
import { useOutletContext } from 'react-router-dom';

/**
 * §7.4 -- each tab is its own lazy route (`/groups/:id/expenses`, `/balances`, …).
 *
 * That gives tabs real URLs — shareable and back-button correct — and code-splits
 * what was a very large page. The panels themselves are unchanged; these thin
 * wrappers just read the shared state off the router outlet instead of taking it
 * as props from a parent that rendered them conditionally.
 */

const ExpensesTab = lazy(() => import('../../../expenses/components/ExpensesTab'));
const BalancesTab = lazy(() => import('../../../balances/components/BalancesTab'));
const TotalsTab = lazy(() => import('./TotalsTab'));
const MembersTab = lazy(() => import('./MembersTab'));
const WhiteboardTab = lazy(() => import('./WhiteboardTab'));

export const ExpensesTabRoute = () => {
    const ctx = useOutletContext();
    return (
        <ExpensesTab
            group={ctx.group}
            filteredExpenses={ctx.filteredExpenses}
            formatCurrency={ctx.formatCurrency}
            hoveredExpense={ctx.hoveredExpense}
            setHoveredExpense={ctx.setHoveredExpense}
            toggleQuickAdd={ctx.toggleQuickAdd}
            containerVariants={ctx.containerVariants}
            cardVariants={ctx.cardVariants}
        />
    );
};

export const BalancesTabRoute = () => {
    const ctx = useOutletContext();
    return (
        <BalancesTab
            balances={ctx.balances}
            formatCurrency={ctx.formatCurrency}
            handleSettleUp={ctx.handleSettleUp}
            containerVariants={ctx.containerVariants}
            cardVariants={ctx.cardVariants}
        />
    );
};

export const TotalsTabRoute = () => {
    const ctx = useOutletContext();
    return (
        <TotalsTab
            group={ctx.group}
            expenses={ctx.expenses}
            totalExpenses={ctx.totalExpenses}
            categoryTotals={ctx.categoryTotals}
            monthlyTotals={ctx.monthlyTotals}
            formatCurrency={ctx.formatCurrency}
            containerVariants={ctx.containerVariants}
            cardVariants={ctx.cardVariants}
        />
    );
};

export const MembersTabRoute = () => {
    const ctx = useOutletContext();
    return (
        <MembersTab
            group={ctx.group}
            expenses={ctx.expenses}
            formatCurrency={ctx.formatCurrency}
            handleSettleUp={ctx.handleSettleUp}
            handleRemoveMember={ctx.handleRemoveMember}
            containerVariants={ctx.containerVariants}
            cardVariants={ctx.cardVariants}
        />
    );
};

export const WhiteboardTabRoute = () => {
    const ctx = useOutletContext();
    return <WhiteboardTab groupId={ctx.group.id} />;
};
