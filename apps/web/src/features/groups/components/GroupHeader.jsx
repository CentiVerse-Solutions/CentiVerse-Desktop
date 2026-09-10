import { motion } from 'framer-motion';
import { PlusCircle, RefreshCw, Settings, Share2, Upload, Users } from 'lucide-react';
import { VIEWER_ID } from '../../../shared/people/viewer';

/**
 * 7.4 -- extracted from GroupDetails verbatim (behaviour-preserving):
 * identical markup and ARIA wiring; state arrives as props.
 */
const GroupHeader = ({
    group,
    expenses,
    balances,
    totalExpenses,
    myExpenses,
    formatCurrency,
    toggleQuickAdd,
    setShowExportModal,
    itemVariants,
    cardVariants,
    containerVariants,
}) => (
    <>
    {/* Group Header */}
    <motion.div
        className="group-header"
        style={{ backgroundImage: `url(${group.banner})` }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
    >
        <div className="group-header-overlay">
            <motion.div
                className="group-info"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
            >
                <motion.div
                    className="group-avatar"
                    whileHover={{ scale: 1.05, boxShadow: "0 8px 20px rgba(0, 0, 0, 0.3)" }}
                >
                    <motion.img
                        src={group.avatar}
                        alt={group.name}
                        whileHover={{ scale: 1.1 }}
                    />
                </motion.div>
                <div className="group-details">
                    <motion.h1
                        className="group-name"
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 20 }}
                    >
                        {group.name}
                    </motion.h1>
                    <motion.p
                        className="group-members"
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 20 }}
                    >
                        <Users size={14} className="icon-inline" /> {group.members.length} members · Created on {new Date(group.createdAt).toLocaleDateString()}
                    </motion.p>
                </div>
            </motion.div>
    
            <motion.div
                className="group-quick-stats"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
            >
                <div className="quick-stat">
                    <span className="quick-stat-label">Total Expenses</span>
                    <span className="quick-stat-value">{formatCurrency(totalExpenses)}</span>
                </div>
                <div className="quick-stat">
                    <span className="quick-stat-label">Your Balance</span>
                    <span className={`quick-stat-value ${balances.find(b => b.id === VIEWER_ID)?.balance > 0 ? 'positive' : balances.find(b => b.id === VIEWER_ID)?.balance < 0 ? 'negative' : ''}`}>
                        {formatCurrency(balances.find(b => b.id === VIEWER_ID)?.balance || 0)}
                    </span>
                </div>
                <div className="quick-stat">
                    <span className="quick-stat-label">Last Activity</span>
                    <span className="quick-stat-value">
                        {expenses.length > 0
                            ? new Date(Math.max(...expenses.map(e => new Date(e.date)))).toLocaleDateString()
                            : 'No activity yet'}
                    </span>
                </div>
            </motion.div>
        </div>
    </motion.div>
    
    {/* Group Actions */}
    <motion.div
        className="group-actions"
        variants={itemVariants}
    >
        <motion.button
            className="action-btn primary"
            onClick={toggleQuickAdd}
            whileHover={{ y: -3, boxShadow: "0 6px 20px rgba(105, 162, 151, 0.4)" }}
            whileTap={{ scale: 0.95 }}
        >
            <PlusCircle size={18} />
            <span>Add Expense</span>
        </motion.button>
        <motion.button
            className="action-btn secondary"
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.95 }}
        >
            <RefreshCw size={18} />
            <span>Settle Up</span>
        </motion.button>
        <motion.button
            className="action-btn tertiary"
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.95 }}
        >
            <Share2 size={18} />
            <span>Share Group</span>
        </motion.button>
        <motion.button
            className="action-btn tertiary"
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.95 }}
        >
            <Settings size={18} />
            <span>Settings</span>
        </motion.button>
        <motion.button
            className="action-btn tertiary"
            onClick={() => setShowExportModal(true)}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.95 }}
        >
            <Upload size={18} />
            <span>Export</span>
        </motion.button>
    </motion.div>
    
    {/* Group Summary */}
    <motion.div
        className="group-summary"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
    >
        <motion.div
            className="summary-card"
            variants={cardVariants}
            whileHover="hover"
            whileTap="tap"
        >
            <h3 className="summary-title">TOTAL EXPENSES</h3>
            <p className="summary-value">{formatCurrency(totalExpenses)}</p>
            <div className="summary-trend">
                {expenses.length > 0 && <span className="trend-text">
                    {formatCurrency(totalExpenses / expenses.length)} per expense
                </span>}
            </div>
        </motion.div>
        <motion.div
            className="summary-card"
            variants={cardVariants}
            whileHover="hover"
            whileTap="tap"
        >
            <h3 className="summary-title">YOUR BALANCE</h3>
            <p className={`summary-value ${balances.find(b => b.id === VIEWER_ID)?.balance > 0 ? 'positive' : balances.find(b => b.id === VIEWER_ID)?.balance < 0 ? 'negative' : ''}`}>
                {formatCurrency(balances.find(b => b.id === VIEWER_ID)?.balance || 0)}
            </p>
            <div className="summary-trend">
                {balances.find(b => b.id === VIEWER_ID)?.balance !== 0 ? (
                    <span className="trend-text">
                        {balances.find(b => b.id === VIEWER_ID)?.balance > 0
                            ? 'You are owed money'
                            : 'You owe money'}
                    </span>
                ) : (
                    <span className="trend-text">All settled up!</span>
                )}
            </div>
        </motion.div>
        <motion.div
            className="summary-card"
            variants={cardVariants}
            whileHover="hover"
            whileTap="tap"
        >
            <h3 className="summary-title">YOUR EXPENSES</h3>
            <p className="summary-value">{formatCurrency(myExpenses)}</p>
            <div className="summary-trend">
                <span className="trend-text">
                    {((myExpenses / totalExpenses) * 100).toFixed(1)}% of group total
                </span>
            </div>
        </motion.div>
    </motion.div>
    </>
);

export default GroupHeader;
