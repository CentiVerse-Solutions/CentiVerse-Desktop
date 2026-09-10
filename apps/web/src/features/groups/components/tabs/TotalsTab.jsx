import { motion } from 'framer-motion';
import { ArrowUpRight, BarChart2, Calendar, Clock, DollarSign, Info, Tag, User, Users } from 'lucide-react';
import { Area, Bar, BarChart, CartesianGrid, Cell, ComposedChart, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

/**
 * 7.4 -- extracted from GroupDetails verbatim. Behaviour-preserving:
 * identical markup, ARIA wiring and animation variants; the state it reads
 * now arrives as props.
 */
const TotalsTab = ({
    group,
    expenses,
    totalExpenses,
    categoryTotals,
    monthlyTotals,
    formatCurrency,
    containerVariants,
    cardVariants,
}) => (
    <div
                            className="totals-container"
                            role="tabpanel"
                            id="totals-tab"
                            aria-labelledby="totals-tab-btn"
                        >
                            {/* Dashboard Summary Cards */}
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
    
                            {/* Expense Trend Over Time - Line Chart */}
                            <motion.div
                                className="analysis-card expense-trend-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <div className="analysis-card-header">
                                    <h3 className="section-title">
                                        <motion.span
                                            className="title-icon-wrapper"
                                            initial={{ rotate: -45, scale: 0.5 }}
                                            animate={{ rotate: 0, scale: 1 }}
                                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                        >
                                            <BarChart2 size={18} />
                                        </motion.span>
                                        Expense Trend
                                    </h3>
                                    <p className="section-subtitle">How your expenses have changed over time</p>
                                </div>
    
                                <div className="analysis-card-content">
                                    {monthlyTotals.length > 0 ? (
                                        <div className="chart-container">
                                            <ResponsiveContainer width="100%" height={300}>
                                                <ComposedChart
                                                    data={monthlyTotals}
                                                    margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                                                >
                                                    <defs>
                                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#69a297" stopOpacity={0.8} />
                                                            <stop offset="95%" stopColor="#69a297" stopOpacity={0.1} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                    <XAxis
                                                        dataKey="month"
                                                        tickMargin={10}
                                                        axisLine={{ stroke: '#e0e0e0' }}
                                                        tick={{ fill: '#666', fontSize: 12 }}
                                                    />
                                                    <YAxis
                                                        tickFormatter={(value) => formatCurrency(value).split('.')[0]}
                                                        axisLine={{ stroke: '#e0e0e0' }}
                                                        tick={{ fill: '#666', fontSize: 12 }}
                                                    />
                                                    <Tooltip
                                                        formatter={(value) => [formatCurrency(value), "Amount"]}
                                                        labelFormatter={(label) => `${label} ${monthlyTotals.find(m => m.month === label)?.year}`}
                                                        contentStyle={{
                                                            backgroundColor: '#fff',
                                                            border: 'none',
                                                            borderRadius: '10px',
                                                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                                                            padding: '10px 14px'
                                                        }}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="total"
                                                        fill="url(#colorTotal)"
                                                        stroke="#69a297"
                                                        strokeWidth={3}
                                                        dot={{ stroke: '#69a297', strokeWidth: 2, r: 4, fill: '#fff' }}
                                                        activeDot={{ stroke: '#69a297', strokeWidth: 2, r: 6, fill: '#fff' }}
                                                    />
                                                    <Bar
                                                        dataKey="total"
                                                        barSize={20}
                                                        fill="#a3c9a8"
                                                        radius={[4, 4, 0, 0]}
                                                        fillOpacity={0.6}
                                                    />
                                                </ComposedChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <div className="empty-chart-message">
                                            <p>Add some expenses to see your spending trends</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
    
                            {/* Spending by Category - Interactive Pie Chart */}
                            <div className="analysis-grid">
                                <motion.div
                                    className="analysis-card category-breakdown-card"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <div className="analysis-card-header">
                                        <h3 className="section-title">
                                            <motion.span
                                                className="title-icon-wrapper"
                                                initial={{ rotate: -45, scale: 0.5 }}
                                                animate={{ rotate: 0, scale: 1 }}
                                                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                                            >
                                                <PieChart size={18} />
                                            </motion.span>
                                            Spending by Category
                                        </h3>
                                        <p className="section-subtitle">Where your money is going</p>
                                    </div>
    
                                    <div className="analysis-card-content">
                                        {categoryTotals.length > 0 ? (
                                            <div className="chart-container">
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <PieChart>
                                                        <Pie
                                                            data={categoryTotals}
                                                            cx="50%"
                                                            cy="50%"
                                                            labelLine={false}
                                                            outerRadius={120}
                                                            innerRadius={60}
                                                            dataKey="total"
                                                            nameKey="name"
                                                            paddingAngle={2}
                                                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                                                        >
                                                            {categoryTotals.map((entry, index) => (
                                                                <Cell
                                                                    key={`cell-${index}`}
                                                                    fill={`hsl(${160 - index * 12}, ${60 - index * 2}%, ${60 - index * 1.5}%)`}
                                                                />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip
                                                            formatter={(value) => [formatCurrency(value), "Amount"]}
                                                            contentStyle={{
                                                                backgroundColor: '#fff',
                                                                border: 'none',
                                                                borderRadius: '10px',
                                                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                                                                padding: '10px 14px'
                                                            }}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        ) : (
                                            <div className="empty-chart-message">
                                                <p>Add some expenses to see category breakdown</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
    
                                {/* Member Contribution - Bar Chart */}
                                <motion.div
                                    className="analysis-card member-contribution-card"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    <div className="analysis-card-header">
                                        <h3 className="section-title">
                                            <motion.span
                                                className="title-icon-wrapper"
                                                initial={{ rotate: -45, scale: 0.5 }}
                                                animate={{ rotate: 0, scale: 1 }}
                                                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                                            >
                                                <Users size={18} />
                                            </motion.span>
                                            Member Contribution
                                        </h3>
                                        <p className="section-subtitle">Who's paying what</p>
                                    </div>
    
                                    <div className="analysis-card-content">
                                        {group.members.length > 0 ? (
                                            <div className="chart-container">
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <BarChart
                                                        data={group.members.map(member => {
                                                            const memberExpenses = expenses.filter(e => e.paidBy.id === member.id);
                                                            const memberTotal = memberExpenses.reduce((sum, e) => sum + e.amount, 0);
                                                            return {
                                                                id: member.id,
                                                                name: member.name,
                                                                avatar: member.avatar,
                                                                total: memberTotal,
                                                                percentage: totalExpenses > 0 ? (memberTotal / totalExpenses) * 100 : 0
                                                            };
                                                        }).sort((a, b) => b.total - a.total)}
                                                        layout="vertical"
                                                        margin={{ top: 10, right: 30, left: 70, bottom: 10 }}
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                                                        <XAxis
                                                            type="number"
                                                            tickFormatter={(value) => formatCurrency(value).split('.')[0]}
                                                            axisLine={{ stroke: '#e0e0e0' }}
                                                            tick={{ fill: '#666', fontSize: 12 }}
                                                        />
                                                        <YAxis
                                                            type="category"
                                                            dataKey="name"
                                                            axisLine={{ stroke: '#e0e0e0' }}
                                                            tick={{ fill: '#666', fontSize: 12 }}
                                                            tickLine={false}
                                                            width={60}
                                                        />
                                                        <Tooltip
                                                            formatter={(value) => [formatCurrency(value), "Amount"]}
                                                            contentStyle={{
                                                                backgroundColor: '#fff',
                                                                border: 'none',
                                                                borderRadius: '10px',
                                                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                                                                padding: '10px 14px'
                                                            }}
                                                        />
                                                        <Bar
                                                            dataKey="total"
                                                            fill="#84b59f"
                                                            radius={[0, 4, 4, 0]}
                                                        >
                                                            <LabelList
                                                                dataKey="percentage"
                                                                position="right"
                                                                formatter={(value) => `${value.toFixed(1)}%`}
                                                                style={{ fill: '#666', fontSize: 12 }}
                                                            />
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        ) : (
                                            <div className="empty-chart-message">
                                                <p>Add some members to see contribution breakdown</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </div>
    
                            {/* Enhanced Insights Cards */}
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
                        </div>
);

export default TotalsTab;
