import type { Group } from '../../../data/port';
import type { LegacyExpense } from '../../../data/legacy';
import { motion } from 'framer-motion';

/**
 * 7.4 -- extracted from GroupDetails verbatim (behaviour-preserving).
 */
interface ExpenseFiltersProps {
    group: Group;
    expenses: LegacyExpense[];
    expenseFilter: string;
    setExpenseFilter: (value: unknown) => void;
    timePeriod: string;
    setTimePeriod: (value: unknown) => void;
    sortBy: string;
    setSortBy: (value: unknown) => void;
}

const ExpenseFilters = ({
    group,
    expenses,
    expenseFilter,
    setExpenseFilter,
    timePeriod,
    setTimePeriod,
    sortBy,
    setSortBy,
}: ExpenseFiltersProps) => (
    <motion.div
                        className="filter-controls"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="filter-group">
                            <label>View</label>
                            <div className="filter-options">
                                <button
                                    className={`filter-option ${expenseFilter === 'all' ? 'active' : ''}`}
                                    onClick={() => setExpenseFilter('all')}
                                >
                                    All Expenses
                                </button>
                                <button
                                    className={`filter-option ${expenseFilter === 'you_paid' ? 'active' : ''}`}
                                    onClick={() => setExpenseFilter('you_paid')}
                                >
                                    You Paid
                                </button>
                                <button
                                    className={`filter-option ${expenseFilter === 'you_involved' ? 'active' : ''}`}
                                    onClick={() => setExpenseFilter('you_involved')}
                                >
                                    Involving You
                                </button>
                            </div>
                        </div>
    
                        <div className="filter-group">
                            <label>Time</label>
                            <div className="filter-options">
                                <button
                                    className={`filter-option ${timePeriod === 'all' ? 'active' : ''}`}
                                    onClick={() => setTimePeriod('all')}
                                >
                                    All Time
                                </button>
                                <button
                                    className={`filter-option ${timePeriod === 'this_month' ? 'active' : ''}`}
                                    onClick={() => setTimePeriod('this_month')}
                                >
                                    This Month
                                </button>
                                <button
                                    className={`filter-option ${timePeriod === 'last_month' ? 'active' : ''}`}
                                    onClick={() => setTimePeriod('last_month')}
                                >
                                    Last Month
                                </button>
                                <button
                                    className={`filter-option ${timePeriod === 'this_year' ? 'active' : ''}`}
                                    onClick={() => setTimePeriod('this_year')}
                                >
                                    This Year
                                </button>
                            </div>
                        </div>
    
                        <div className="filter-group">
                            <label>Sort</label>
                            <div className="filter-options">
                                <button
                                    className={`filter-option ${sortBy === 'date_desc' ? 'active' : ''}`}
                                    onClick={() => setSortBy('date_desc')}
                                >
                                    Newest First
                                </button>
                                <button
                                    className={`filter-option ${sortBy === 'date_asc' ? 'active' : ''}`}
                                    onClick={() => setSortBy('date_asc')}
                                >
                                    Oldest First
                                </button>
                                <button
                                    className={`filter-option ${sortBy === 'amount_desc' ? 'active' : ''}`}
                                    onClick={() => setSortBy('amount_desc')}
                                >
                                    Highest Amount
                                </button>
                                <button
                                    className={`filter-option ${sortBy === 'amount_asc' ? 'active' : ''}`}
                                    onClick={() => setSortBy('amount_asc')}
                                >
                                    Lowest Amount
                                </button>
                            </div>
                        </div>
                    </motion.div>
);

export default ExpenseFilters;
