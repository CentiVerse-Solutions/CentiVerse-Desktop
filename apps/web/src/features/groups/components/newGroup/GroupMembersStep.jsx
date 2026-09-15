import { motion } from 'framer-motion';
import { Check, Search, X } from 'lucide-react';

/**
 * 7.4 -- one step of the new-group wizard, split out verbatim.
 */
const GroupMembersStep = ({
    errors,
    filteredFriends,
    formData,
    friends,
    searchQuery,
    setSearchQuery,
    step,
    stepVariants,
    toggleMember,
}) => (
    <motion.div
        key="step2"
        className="form-step"
        variants={stepVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
    >
        <div className="form-group">
            <label>Search Friends</label>
            <div className="search-input">
                <Search size={18} className="search-icon" />
                <input
                    type="text"
                    placeholder="Search by name or email"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <motion.button
                        type="button"
                        className="clear-search"
                        onClick={() => setSearchQuery('')}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <X size={14} />
                    </motion.button>
                )}
            </div>
        </div>
    
        <div className="form-group">
            <label>Select Members*</label>
            <div className="friends-list">
                {filteredFriends.length > 0 ? (
                    filteredFriends.map((friend, index) => {
                        const isSelected = formData.members.some(m => m.id === friend.id);
                        return (
                            <motion.div
                                key={friend.id}
                                className={`friend-item ${isSelected ? 'selected' : ''}`}
                                onClick={() => toggleMember(friend)}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ backgroundColor: "rgba(105, 162, 151, 0.1)" }}
                            >
                                <div className="friend-avatar">
                                    <img src={friend.avatar} alt={friend.name} />
                                </div>
                                <div className="friend-info">
                                    <div className="friend-name">{friend.name}</div>
                                    <div className="friend-email">{friend.email}</div>
                                </div>
                                <div className="friend-select">
                                    <div className={`checkbox ${isSelected ? 'checked' : ''}`}>
                                        {isSelected && <Check size={14} />}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                ) : (
                    <div className="no-results">
                        <p>No friends found matching your search.</p>
                    </div>
                )}
            </div>
            {errors.members && <div className="error-message">{errors.members}</div>}
        </div>
    
        <div className="selected-members-summary">
            <p>
                <strong>Selected: </strong>
                {formData.members.length}
                {formData.members.length === 1 ? ' member' : ' members'}
            </p>
        </div>
    </motion.div>
);

export default GroupMembersStep;
