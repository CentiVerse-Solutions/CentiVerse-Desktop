import { motion } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, CheckCircle, Clock, DollarSign } from 'lucide-react';

/**
 * 7.4 -- split out verbatim (behaviour-preserving).
 */
const GroupCardBody = ({
    userBalance,
    activityStatus,
    balanceVariants,
    formatCurrency,
    formatDate,
    group,
    lastActivity,
    totalSpent,
}) => (
    <div className="group-card-body">
        <div className="group-card-stats">
            <div className="group-card-stat">
                <div className="stat-label">
                    <DollarSign size={14} />
                    <span>Total Spending</span>
                </div>
                <motion.div
                    className="stat-value"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    {formatCurrency(totalSpent)}
                </motion.div>
            </div>
    
            <div className="group-card-stat">
                <div className="stat-label">
                    <Clock size={14} />
                    <span>Recent Activity</span>
                </div>
                <motion.div
                    className={`stat-value ${activityStatus}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    {formatDate(lastActivity?.date)}
                </motion.div>
            </div>
        </div>
    
        <motion.div
            className="group-card-balance"
            variants={balanceVariants}
        >
            {userBalance !== 0 ? (
                userBalance > 0 ? (
                    <div className="balance-chip negative">
                        <div className="balance-icon">
                            <ArrowUpRight size={16} />
                        </div>
                        <div className="balance-text">
                            <span className="balance-label">You owe</span>
                            <span className="balance-amount">{formatCurrency(userBalance)}</span>
                        </div>
                    </div>
                ) : (
                    <div className="balance-chip positive">
                        <div className="balance-icon">
                            <ArrowDownLeft size={16} />
                        </div>
                        <div className="balance-text">
                            <span className="balance-label">You're owed</span>
                            <span className="balance-amount">{formatCurrency(Math.abs(userBalance))}</span>
                        </div>
                    </div>
                )
            ) : (
                <div className="balance-chip neutral">
                    <div className="balance-icon">
                        <CheckCircle size={16} />
                    </div>
                    <div className="balance-text">
                        <span className="balance-label">All settled up</span>
                        <span className="balance-amount">{formatCurrency(0)}</span>
                    </div>
                </div>
            )}
        </motion.div>
    </div>
);

export default GroupCardBody;
