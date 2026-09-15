import { motion } from 'framer-motion';
import { Button } from '../../../components/common/Button/Button';
import SearchBar from '../../../components/common/SearchBar/SearchBar';
import { Filter, Search } from 'lucide-react';

/**
 * 7.4 -- extracted from Activity verbatim (behaviour-preserving).
 */
const ActivityHeader = ({
    activities,
    itemVariants,
    setSearchQuery,
    setShowFilters,
    showFilters,
}) => (
    <motion.div className="act-header" variants={itemVariants}>
        <h1 className="act-title">Activity</h1>
    
        <div className="act-controls">
            <SearchBar
                onSearch={setSearchQuery}
                placeholder="Search activities..."
                icon={<Search size={18} />}
                className="act-search"
            />
    
            <Button
                onClick={() => setShowFilters(!showFilters)}
                className="act-filter-btn"
                variant={showFilters ? "primary" : "outline"}
                icon={<Filter size={18} />}
            >
                Filter
            </Button>
        </div>
    </motion.div>
);

export default ActivityHeader;
