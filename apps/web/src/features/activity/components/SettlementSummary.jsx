import { motion } from 'framer-motion';
import { Button } from '../../../components/common/Button/Button';
import { ArrowDownLeft, ArrowUpRight, ChevronRight } from 'lucide-react';

/**
 * 7.4 -- extracted from Activity verbatim (behaviour-preserving).
 */
const SettlementSummary = ({
    formatCurrency,
    itemVariants,
    summary,
}) => (
    <>
    {/* New Settlement Summary Section */}
    <motion.div
        className="act-settlement-summary"
        variants={itemVariants}
    >
        <div className="act-settlement-card outgoing">
            <div className="act-settlement-icon">
                <ArrowUpRight size={20} />
            </div>
            <div className="act-settlement-info">
                <h3 className="act-settlement-label">You owe</h3>
                <div className="act-settlement-amount">{formatCurrency(summary.youOwe)}</div>
            </div>
            <Button
                variant="outline"
                size="small"
                className="act-view-btn"
                icon={<ChevronRight size={16} />}
            >
                View
            </Button>
        </div>
    
        <div className="act-settlement-card incoming">
            <div className="act-settlement-icon">
                <ArrowDownLeft size={20} />
            </div>
            <div className="act-settlement-info">
                <h3 className="act-settlement-label">You are owed</h3>
                <div className="act-settlement-amount">{formatCurrency(summary.youAreOwed)}</div>
            </div>
            <Button
                variant="outline"
                size="small"
                className="act-view-btn"
                icon={<ChevronRight size={16} />}
            >
                View
            </Button>
        </div>
    
        <div className={`act-settlement-card balance ${summary.netBalance >= 0 ? 'positive' : 'negative'}`}>
            <div className="act-settlement-info">
                <h3 className="act-settlement-label">Net balance</h3>
                <div className="act-settlement-amount">
                    {summary.netBalance >= 0 ? '+' : ''}{formatCurrency(summary.netBalance)}
                </div>
            </div>
        </div>
    </motion.div>
    </>
);

export default SettlementSummary;
