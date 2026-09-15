import { motion } from 'framer-motion';
import { Button } from '../../../components/common/Button/Button';
import SearchBar from '../../../components/common/SearchBar/SearchBar';
import { Search } from 'lucide-react';

/**
 * 7.4 -- extracted from Friends verbatim (behaviour-preserving).
 */
const FriendsSearchFilter = ({
    filterBy,
    friends,
    handleFilterChange,
    handleSearchChange,
}) => (
    <div className="fr-search-filter-container">
        <motion.div
            initial={{ width: "80%", opacity: 0 }}
            animate={{ width: "100%", opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
        >
            <SearchBar
                onSearch={handleSearchChange}
                placeholder="Search friends..."
                icon={<Search size={18} />}
                className="fr-search"
            />
        </motion.div>
    
        <motion.div
            className="fr-filter-buttons"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.3 }}
        >
            <div className="fr-filter-scroll">
                <Button
                    onClick={() => handleFilterChange('all')}
                    className={`fr-filter-btn ${filterBy === 'all' ? 'active' : ''}`}
                    variant="outline"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    All
                </Button>
                <Button
                    onClick={() => handleFilterChange('owesYou')}
                    className={`fr-filter-btn ${filterBy === 'owesYou' ? 'active' : ''}`}
                    variant="outline"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    Owes You
                </Button>
                <Button
                    onClick={() => handleFilterChange('youOwe')}
                    className={`fr-filter-btn ${filterBy === 'youOwe' ? 'active' : ''}`}
                    variant="outline"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    You Owe
                </Button>
                <Button
                    onClick={() => handleFilterChange('settled')}
                    className={`fr-filter-btn ${filterBy === 'settled' ? 'active' : ''}`}
                    variant="outline"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    Settled
                </Button>
            </div>
        </motion.div>
    </div>
);

export default FriendsSearchFilter;
