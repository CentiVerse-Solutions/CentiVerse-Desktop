import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

/**
 * 7.4 -- split out of SideNavbar verbatim (behaviour-preserving).
 */
const SideNavGroups = ({
    currentPath,
    displayPinnedGroups,
    displayRegularGroups,
    groups,
    handleCreateGroup,
    handleGroupOptions,
    itemVariants,
}) => (
    <>
    {displayPinnedGroups.length > 0 && (
        <div className="side-nav-section">
            <motion.h3
                className="section-title"
                variants={itemVariants}
            >
                Pinned Groups
            </motion.h3>
            <div className="side-nav-groups">
                {displayPinnedGroups.map((group) => (
                    <motion.div key={group.id || `pinned-${group.name}`} variants={itemVariants}>
                        <Link
                            to={`/groups/${group.id}`}
                            className={`nav-group-item ${currentPath === `/groups/${group.id}` ? 'active' : ''}`}
                            aria-current={currentPath === `/groups/${group.id}` ? 'page' : undefined}
                        >
                            <div className="nav-group-avatar">
                                {group.avatar && (
                                    <img
                                        src={group.avatar}
                                        alt=""
                                        aria-hidden="true"
                                    />
                                )}
                            </div>
                            <div className="nav-group-info">
                                <span className="nav-group-name">{group.name}</span>
                                {group.unreadCount > 0 && (
                                    <span className="unread-badge">{group.unreadCount}</span>
                                )}
                            </div>
                            <motion.button
                                type="button"
                                className="group-options-btn"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => handleGroupOptions(e, group)}
                                aria-label={`Options for ${group.name}`}
                            >
                                ⋮
                            </motion.button>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    )}
    
    {/* Regular Groups Section */}
    <div className="side-nav-section">
        <motion.h3
            className="section-title"
            variants={itemVariants}
        >
            Your Groups
        </motion.h3>
        <div className="side-nav-groups">
            {displayRegularGroups.length > 0 ? (
                displayRegularGroups.map((group) => (
                    <motion.div key={group.id || `group-${group.name}`} variants={itemVariants}>
                        <Link
                            to={`/groups/${group.id}`}
                            className={`nav-group-item ${currentPath === `/groups/${group.id}` ? 'active' : ''}`}
                            aria-current={currentPath === `/groups/${group.id}` ? 'page' : undefined}
                        >
                            <div className="nav-group-avatar">
                                {group.avatar && (
                                    <img
                                        src={group.avatar}
                                        alt=""
                                        aria-hidden="true"
                                    />
                                )}
                            </div>
                            <div className="nav-group-info">
                                <span className="nav-group-name">{group.name}</span>
                                {group.unreadCount > 0 && (
                                    <span className="unread-badge">{group.unreadCount}</span>
                                )}
                            </div>
                            <motion.button
                                type="button"
                                className="group-options-btn"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => handleGroupOptions(e, group)}
                                aria-label={`Options for ${group.name}`}
                            >
                                ⋮
                            </motion.button>
                        </Link>
                    </motion.div>
                ))
            ) : (
                <motion.div
                    className="empty-groups-message"
                    variants={itemVariants}
                >
                    <p>No groups found</p>
                    <button
                        type="button"
                        className="create-first-group-btn"
                        onClick={handleCreateGroup}
                    >
                        Create your first group
                    </button>
                </motion.div>
            )}
        </div>
    </div>
    </>
);

export default SideNavGroups;
