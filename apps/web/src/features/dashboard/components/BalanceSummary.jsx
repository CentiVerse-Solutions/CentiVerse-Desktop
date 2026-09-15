import { motion } from 'framer-motion';
import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react';

/**
 * 7.4 -- split out verbatim (behaviour-preserving).
 */
const BalanceSummary = ({
    balanceSummary,
    formatCurrency,
    itemVariants,
}) => (
    <motion.div className="balance-summary" variants={itemVariants}>
        <div className="balance-card net-balance">
            <div className="balance-icon">
                <DollarSign size={24} />
            </div>
            <div className="balance-details">
                <h3 className="balance-title">Net Balance</h3>
                <p className={`balance-amount ${balanceSummary.netBalance >= 0 ? 'positive' : 'negative'}`}>
                    {formatCurrency(balanceSummary.netBalance)}
                </p>
            </div>
        </div>
    
        <div className="balance-card you-are-owed">
            <div className="balance-icon">
                <TrendingDown size={24} />
            </div>
            <div className="balance-details">
                <h3 className="balance-title">You Are Owed</h3>
                <p className="balance-amount positive">
                    {formatCurrency(balanceSummary.youAreOwed)}
                </p>
            </div>
        </div>
    
        <div className="balance-card you-owe">
            <div className="balance-icon">
                <TrendingUp size={24} />
            </div>
            <div className="balance-details">
                <h3 className="balance-title">You Owe</h3>
                <p className="balance-amount negative">
                    {formatCurrency(balanceSummary.youOwe)}
                </p>
            </div>
        </div>
    </motion.div>
);

export default BalanceSummary;
