import { motion } from 'framer-motion';
import { BarChart2, DollarSign, User } from 'lucide-react';
import { PieChart } from 'recharts';

/**
 * 7.4 -- split out of TotalsTab verbatim to bring it under the
 * 300-line limit. Behaviour-preserving.
 */
const AnalysisSummaryCards = ({
    group,
    expenses,
    totalExpenses,
    categoryTotals,
    monthlyTotals,
    formatCurrency,
}) => (
    <motion.div
            className="analysis-summary-cards"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
        >
            <div className="summary-cards-grid">
                <motion.div
                    className="analysis-summary-card"
                    whileHover={{ y: -5, boxShadow: "0 12px 30px rgba(0, 0, 0, 0.1)" }}
                >
                    <div className="summary-card-icon">
                        <DollarSign size={24} />
                    </div>
                    <div className="summary-card-content">
                        <h4>Total Spent</h4>
                        <p className="summary-card-value">{formatCurrency(totalExpenses)}</p>
                        <p className="summary-card-trend">
                            {monthlyTotals.length > 1 &&
                                `${monthlyTotals[monthlyTotals.length - 1].total > monthlyTotals[monthlyTotals.length - 2].total
                                    ? '↑' : '↓'} ${((Math.abs(monthlyTotals[monthlyTotals.length - 1].total - monthlyTotals[monthlyTotals.length - 2].total) /
                                        monthlyTotals[monthlyTotals.length - 2].total) * 100).toFixed(1)}% from last month`
                            }
                        </p>
                    </div>
                </motion.div>
        
                <motion.div
                    className="analysis-summary-card"
                    whileHover={{ y: -5, boxShadow: "0 12px 30px rgba(0, 0, 0, 0.1)" }}
                >
                    <div className="summary-card-icon">
                        <BarChart2 size={24} />
                    </div>
                    <div className="summary-card-content">
                        <h4>Average per Expense</h4>
                        <p className="summary-card-value">{formatCurrency(expenses.length > 0 ? totalExpenses / expenses.length : 0)}</p>
                        <p className="summary-card-trend">{expenses.length} total expenses</p>
                    </div>
                </motion.div>
        
                <motion.div
                    className="analysis-summary-card"
                    whileHover={{ y: -5, boxShadow: "0 12px 30px rgba(0, 0, 0, 0.1)" }}
                >
                    <div className="summary-card-icon">
                        <PieChart size={24} />
                    </div>
                    <div className="summary-card-content">
                        <h4>Top Category</h4>
                        <p className="summary-card-value">
                            {categoryTotals.length > 0 ?
                                `${categoryTotals[0].icon} ${categoryTotals[0].name}` :
                                'No data'}
                        </p>
                        <p className="summary-card-trend">
                            {categoryTotals.length > 0 ?
                                `${((categoryTotals[0].total / totalExpenses) * 100).toFixed(1)}% of total` :
                                ''}
                        </p>
                    </div>
                </motion.div>
        
                <motion.div
                    className="analysis-summary-card"
                    whileHover={{ y: -5, boxShadow: "0 12px 30px rgba(0, 0, 0, 0.1)" }}
                >
                    <div className="summary-card-icon">
                        <User size={24} />
                    </div>
                    <div className="summary-card-content">
                        <h4>Top Contributor</h4>
                        {group.members.length > 0 ? (
                            <>
                                <p className="summary-card-value with-avatar">
                                    <span className="mini-avatar">
                                        <img
                                            src={group.members.sort((a, b) => {
                                                const aTotal = expenses.filter(e => e.paidBy.id === a.id).reduce((sum, e) => sum + e.amount, 0);
                                                const bTotal = expenses.filter(e => e.paidBy.id === b.id).reduce((sum, e) => sum + e.amount, 0);
                                                return bTotal - aTotal;
                                            })[0]?.avatar}
                                            alt=""
                                        />
                                    </span>
                                    {group.members.sort((a, b) => {
                                        const aTotal = expenses.filter(e => e.paidBy.id === a.id).reduce((sum, e) => sum + e.amount, 0);
                                        const bTotal = expenses.filter(e => e.paidBy.id === b.id).reduce((sum, e) => sum + e.amount, 0);
                                        return bTotal - aTotal;
                                    })[0]?.name}
                                </p>
                                <p className="summary-card-trend">
                                    {formatCurrency(
                                        expenses.filter(e => e.paidBy.id === group.members.sort((a, b) => {
                                            const aTotal = expenses.filter(e => e.paidBy.id === a.id).reduce((sum, e) => sum + e.amount, 0);
                                            const bTotal = expenses.filter(e => e.paidBy.id === b.id).reduce((sum, e) => sum + e.amount, 0);
                                            return bTotal - aTotal;
                                        })[0]?.id).reduce((sum, e) => sum + e.amount, 0)
                                    )}
                                </p>
                            </>
                        ) : (
                            <p className="summary-card-value">No data</p>
                        )}
                    </div>
                </motion.div>
            </div>
        </motion.div>
);

export default AnalysisSummaryCards;
