import { motion } from 'framer-motion';
import { BarChart2, DollarSign, PenSquare, Users } from 'lucide-react';
import { PieChart } from 'recharts';
import { useNavigate } from 'react-router-dom';

/**
 * 7.4 -- extracted from GroupDetails verbatim (behaviour-preserving):
 * identical markup and ARIA wiring; state arrives as props.
 */
const GroupTabs = ({ activeTab, groupId }) => {
    const navigate = useNavigate();
    // Tabs are routes now (7.4). role/aria wiring is unchanged so the screen
    // behaves and reads exactly as before.
    const setActiveTab = (tab) => navigate(`/groups/${groupId}/${tab}`);

    return (
    <div className="group-tabs" role="tablist">
        <motion.button
            className={`tab-btn ${activeTab === 'expenses' ? 'active' : ''}`}
            onClick={() => setActiveTab('expenses')}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            role="tab"
            aria-selected={activeTab === 'expenses'}
            aria-controls="expenses-tab"
            id="expenses-tab-btn"
        >
            <DollarSign size={16} />
            Expenses
        </motion.button>
        <motion.button
            className={`tab-btn ${activeTab === 'balances' ? 'active' : ''}`}
            onClick={() => setActiveTab('balances')}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            role="tab"
            aria-selected={activeTab === 'balances'}
            aria-controls="balances-tab"
            id="balances-tab-btn"
        >
            <BarChart2 size={16} />
            Balances
        </motion.button>
        <motion.button
            className={`tab-btn ${activeTab === 'totals' ? 'active' : ''}`}
            onClick={() => setActiveTab('totals')}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            role="tab"
            aria-selected={activeTab === 'totals'}
            aria-controls="totals-tab"
            id="totals-tab-btn"
        >
            <PieChart size={16} />
            Analysis
        </motion.button>
        <motion.button
            className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            role="tab"
            aria-selected={activeTab === 'members'}
            aria-controls="members-tab"
            id="members-tab-btn"
        >
            <Users size={16} />
            Members
        </motion.button>
        <motion.button
            className={`tab-btn ${activeTab === 'whiteboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('whiteboard')}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            role="tab"
            aria-selected={activeTab === 'whiteboard'}
            aria-controls="whiteboard-tab"
            id="whiteboard-tab-btn"
        >
            <PenSquare size={16} />
            Notes
        </motion.button>
    </div>
    );
};

export default GroupTabs;
