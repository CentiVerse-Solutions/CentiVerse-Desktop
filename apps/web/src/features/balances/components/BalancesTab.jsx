import { motion } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, Check } from 'lucide-react';
import { VIEWER_ID } from '../../../shared/people/viewer';

/**
 * §7.4 -- extracted from GroupDetails verbatim. Behaviour-preserving:
 * identical markup, ARIA wiring and animation variants; the state it reads
 * now arrives as props.
 */
const BalancesTab = ({
    balances,
    formatCurrency,
    handleSettleUp,
    containerVariants,
    cardVariants,
}) => (
    <div
                            className="balances-container"
                            role="tabpanel"
                            id="balances-tab"
                            aria-labelledby="balances-tab-btn"
                        >
                            <motion.div
                                className="balance-summary"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <h3 className="section-title">Overall Balance</h3>
                                <div className="balance-cards">
                                    <div className="balance-overview-card">
                                        <div className="balance-header">
                                            <h4>Total Balance</h4>
                                            <span className={`balance-value ${balances.find(b => b.id === VIEWER_ID)?.balance > 0 ? 'positive' : balances.find(b => b.id === VIEWER_ID)?.balance < 0 ? 'negative' : ''}`}>
                                                {formatCurrency(balances.find(b => b.id === VIEWER_ID)?.balance || 0)}
                                            </span>
                                        </div>
                                        <div className="balance-details">
                                            <div className="balance-detail-item">
                                                <ArrowDownLeft size={16} className="icon-green" />
                                                <span>You are owed: {formatCurrency(balances.filter(b => b.balance < 0).reduce((sum, b) => sum + Math.abs(b.balance), 0))}</span>
                                            </div>
                                            <div className="balance-detail-item">
                                                <ArrowUpRight size={16} className="icon-red" />
                                                <span>You owe: {formatCurrency(balances.filter(b => b.balance > 0).reduce((sum, b) => sum + b.balance, 0))}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
    
                            <motion.div
                                className="balances-list"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                <h3 className="section-title">Member Balances</h3>
                                <div className="balance-cards">
                                    {balances.filter(balance => balance.id !== VIEWER_ID).map((balance, index) => (
                                        <motion.div
                                            key={balance.id}
                                            className={`balance-card ${balance.balance < 0 ? 'you-are-owed' : balance.balance > 0 ? 'you-owe' : 'settled'}`}
                                            variants={cardVariants}
                                            whileHover="hover"
                                            whileTap="tap"
                                        >
                                            <div className="balance-card-avatar">
                                                <img src={balance.avatar} alt={balance.name} />
                                            </div>
                                            <div className="balance-card-info">
                                                <h4 className="balance-name">{balance.name}</h4>
                                                {balance.balance !== 0 ? (
                                                    <p className={`balance-status ${balance.balance < 0 ? 'positive' : 'negative'}`}>
                                                        {balance.balance < 0 ? (
                                                            <>
                                                                <ArrowDownLeft size={14} />
                                                                <span>owes you {formatCurrency(Math.abs(balance.balance))}</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ArrowUpRight size={14} />
                                                                <span>you owe {formatCurrency(balance.balance)}</span>
                                                            </>
                                                        )}
                                                    </p>
                                                ) : (
                                                    <p className="balance-status settled">
                                                        <Check size={14} />
                                                        <span>all settled up</span>
                                                    </p>
                                                )}
                                            </div>
                                            {balance.balance !== 0 && (
                                                <motion.button
                                                    className="settle-up-btn"
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleSettleUp(balance.id)}
                                                >
                                                    Settle Up
                                                </motion.button>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
    
                            <motion.div
                                className="simplify-debts"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <h3 className="section-title">Simplified Balances</h3>
                                <p className="section-subtitle">The most efficient way to settle all debts</p>
                                <div className="simplified-transactions">
                                    {balances.filter(b => b.balance < 0).map((debtor, index) => {
                                        // Find a creditor (someone with positive balance)
                                        const creditor = balances.find(b => b.balance > 0);
    
                                        if (!creditor) return null;
    
                                        return (
                                            <motion.div
                                                key={`simplified-${debtor.id}`}
                                                className="simplified-transaction"
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.5 + (index * 0.1) }}
                                                whileHover={{ scale: 1.02, backgroundColor: "rgba(105, 162, 151, 0.1)" }}
                                            >
                                                <div className="transaction-users">
                                                    <div className="user-avatar small">
                                                        <img src={debtor.avatar} alt={debtor.name} />
                                                    </div>
                                                    <span className="transaction-arrow" aria-hidden="true">→</span>
                                                    <div className="user-avatar small">
                                                        <img src={creditor.avatar} alt={creditor.name} />
                                                    </div>
                                                </div>
                                                <div className="transaction-names">
                                                    <span className="name-from">{debtor.name}</span>
                                                    <span className="name-to">{creditor.name}</span>
                                                </div>
                                                <p className="transaction-amount">
                                                    {formatCurrency(Math.abs(debtor.balance))}
                                                </p>
                                                <motion.button
                                                    className="record-payment-btn"
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    Record
                                                </motion.button>
                                            </motion.div>
                                        );
                                    })}
    
                                    {balances.filter(b => b.balance < 0).length === 0 && (
                                        <div className="all-settled-message">
                                            <motion.div
                                                className="settled-icon"
                                                animate={{
                                                    scale: [1, 1.2, 1],
                                                    rotate: [0, 10, -10, 0]
                                                }}
                                                transition={{
                                                    duration: 1,
                                                    repeat: Infinity,
                                                    repeatDelay: 2
                                                }}
                                            >
                                                🎉
                                            </motion.div>
                                            <p>All balances are settled!</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
);

export default BalancesTab;
