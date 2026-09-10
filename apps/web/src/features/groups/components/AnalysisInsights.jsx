import { motion } from 'framer-motion';
import { ArrowUpRight, Calendar, Clock, Info, Tag } from 'lucide-react';

/**
 * 7.4 -- split out of TotalsTab verbatim to bring it under the
 * 300-line limit. Behaviour-preserving.
 */
const AnalysisInsights = ({
    expenses,
    totalExpenses,
    formatCurrency,
}) => (
    <motion.div
            className="analysis-insights"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
        >
            <h3 className="section-title">
                <motion.span
                    className="title-icon-wrapper"
                    initial={{ rotate: -45, scale: 0.5 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                >
                    <Info size={18} />
                </motion.span>
                Expense Insights
            </h3>
        
            <div className="insights-grid">
                {expenses.length > 0 && (
                    <>
                        <motion.div
                            className="insight-card"
                            whileHover={{ y: -5, boxShadow: "0 12px 30px rgba(0, 0, 0, 0.1)" }}
                        >
                            <div className="insight-icon">
                                <ArrowUpRight size={20} />
                            </div>
                            <div className="insight-content">
                                <h4>Largest Expense</h4>
                                <p className="insight-value">{formatCurrency(Math.max(...expenses.map(e => e.amount)))}</p>
                                <p className="insight-detail">
                                    {expenses.sort((a, b) => b.amount - a.amount)[0]?.description} on {new Date(expenses.sort((a, b) => b.amount - a.amount)[0]?.date).toLocaleDateString()}
                                </p>
                            </div>
                        </motion.div>
        
                        <motion.div
                            className="insight-card"
                            whileHover={{ y: -5, boxShadow: "0 12px 30px rgba(0, 0, 0, 0.1)" }}
                        >
                            <div className="insight-icon">
                                <Clock size={20} />
                            </div>
                            <div className="insight-content">
                                <h4>Most Active Day</h4>
                                {(() => {
                                    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                                    const expensesByDay = {};
        
                                    expenses.forEach(expense => {
                                        const date = new Date(expense.date);
                                        const day = daysOfWeek[date.getDay()];
        
                                        if (!expensesByDay[day]) {
                                            expensesByDay[day] = { count: 0, total: 0 };
                                        }
        
                                        expensesByDay[day].count += 1;
                                        expensesByDay[day].total += expense.amount;
                                    });
        
                                    const mostActiveDay = Object.entries(expensesByDay)
                                        .sort((a, b) => b[1].count - a[1].count)[0];
        
                                    return (
                                        <>
                                            <p className="insight-value">{mostActiveDay?.[0]}</p>
                                            <p className="insight-detail">
                                                {mostActiveDay?.[1].count} expenses totaling {formatCurrency(mostActiveDay?.[1].total)}
                                            </p>
                                        </>
                                    );
                                })()}
                            </div>
                        </motion.div>
        
                        <motion.div
                            className="insight-card"
                            whileHover={{ y: -5, boxShadow: "0 12px 30px rgba(0, 0, 0, 0.1)" }}
                        >
                            <div className="insight-icon">
                                <Tag size={20} />
                            </div>
                            <div className="insight-content">
                                <h4>Most Frequent Category</h4>
                                {(() => {
                                    const categoryCounts = {};
        
                                    expenses.forEach(expense => {
                                        if (!expense.category) return;
                                        const categoryId = expense.category.id;
        
                                        if (!categoryCounts[categoryId]) {
                                            categoryCounts[categoryId] = {
                                                count: 0,
                                                name: expense.category.name,
                                                icon: expense.category.icon
                                            };
                                        }
        
                                        categoryCounts[categoryId].count += 1;
                                    });
        
                                    const mostFrequentCategory = Object.values(categoryCounts)
                                        .sort((a, b) => b.count - a.count)[0];
        
                                    return (
                                        <>
                                            <p className="insight-value">
                                                {mostFrequentCategory?.icon} {mostFrequentCategory?.name}
                                            </p>
                                            <p className="insight-detail">
                                                Used in {mostFrequentCategory?.count} out of {expenses.length} expenses
                                            </p>
                                        </>
                                    );
                                })()}
                            </div>
                        </motion.div>
        
                        <motion.div
                            className="insight-card"
                            whileHover={{ y: -5, boxShadow: "0 12px 30px rgba(0, 0, 0, 0.1)" }}
                        >
                            <div className="insight-icon">
                                <Calendar size={20} />
                            </div>
                            <div className="insight-content">
                                <h4>Spending Pace</h4>
                                {(() => {
                                    if (expenses.length < 2) return <p className="insight-value">Need more data</p>;
        
                                    const oldestExpense = new Date(Math.min(...expenses.map(e => new Date(e.date))));
                                    const daysSinceStart = Math.max(1, Math.ceil((new Date() - oldestExpense) / (1000 * 60 * 60 * 24)));
                                    const dailyAverage = totalExpenses / daysSinceStart;
                                    const monthlyProjection = dailyAverage * 30;
        
                                    return (
                                        <>
                                            <p className="insight-value">{formatCurrency(dailyAverage)} / day</p>
                                            <p className="insight-detail">
                                                Projected {formatCurrency(monthlyProjection)} this month
                                            </p>
                                        </>
                                    );
                                })()}
                            </div>
                        </motion.div>
                    </>
                )}
            </div>
        </motion.div>
);

export default AnalysisInsights;
