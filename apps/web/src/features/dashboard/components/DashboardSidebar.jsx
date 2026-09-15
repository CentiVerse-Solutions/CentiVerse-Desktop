import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Avatar } from '../../../components/common/Avatar/Avatar';
import { ArrowDownRight, ArrowUpRight, Check, ChevronRight, DollarSign, Receipt, Users } from 'lucide-react';

/**
 * 7.4 -- split out verbatim (behaviour-preserving).
 */
const DashboardSidebar = ({
    formatCurrency,
    itemVariants,
    topFriends,
}) => (
    <div className="dashboard-sidebar">
        <motion.div className="friends-balances-section" variants={itemVariants}>
            <div className="section-header">
                <div className="section-title-container">
                    <div className="title-line"></div>
                    <h2 className="section-title">
                        <Users size={18} />
                        FRIEND BALANCES
                    </h2>
                    <div className="title-line"></div>
                </div>
                <Link to="/friends" className="view-all-link">
                    View All <ChevronRight size={16} />
                </Link>
            </div>
    
            <div className="dashboard-friends-list">
                {topFriends.map((friend) => {
                    // Determine status based on balance
                    let status, icon;
                    if (friend.balance > 0) {
                        status = 'owes-you';
                        icon = <ArrowDownRight size={16} />;
                    } else if (friend.balance < 0) {
                        status = 'you-owe';
                        icon = <ArrowUpRight size={16} />;
                    } else {
                        status = 'settled';
                        icon = <Check size={16} />;
                    }
    
                    return (
                        <div key={friend.id} className="dashboard-friend-item">
                            <div className="dashboard-friend-info">
                                <Avatar src={friend.avatar} alt={friend.name} size="medium" />
                                <h4 className="dashboard-friend-name">{friend.name}</h4>
                            </div>
    
                            <div className={`dashboard-friend-balance ${status}`}>
                                {icon}
                                <span>
                                    {friend.balance === 0
                                        ? 'Settled up'
                                        : friend.balance > 0
                                            ? `Owes you ${formatCurrency(friend.balance)}`
                                            : `You owe ${formatCurrency(Math.abs(friend.balance))}`
                                    }
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    
        <motion.div className="quick-add-section" variants={itemVariants}>
            <h2 className="section-title">Quick Add</h2>
            <div className="quick-actions">
                <button className="quick-action-btn">
                    <Receipt size={20} />
                    <span>Add Expense</span>
                </button>
                <button className="quick-action-btn">
                    <DollarSign size={20} />
                    <span>Settle Up</span>
                </button>
                <button className="quick-action-btn">
                    <Users size={20} />
                    <span>Add Friend</span>
                </button>
            </div>
        </motion.div>
    </div>
);

export default DashboardSidebar;
