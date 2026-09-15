import { motion, AnimatePresence } from 'framer-motion';
import GroupCard from '../../../components/groups/GroupCard/GroupCard';
import { Plus, Users, X } from 'lucide-react';

/**
 * 7.4 -- extracted from GroupList verbatim (behaviour-preserving).
 */
const GroupGrid = ({
    clearFilters,
    containerVariants,
    currentUserId,
    expenses,
    filterApplied,
    filteredGroups,
    groups,
    itemVariants,
    openCreateGroupModal,
    viewMode,
}) => (
    <motion.div
        className={`group-list ${viewMode === 'list' ? 'list-view' : 'grid-view'}`}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        layout
    >
        <AnimatePresence mode="wait">
            {filteredGroups.length > 0 ? (
                <>
                    {filteredGroups.map((group, index) => (
                        <motion.div
                            key={group.id}
                            className="group-card-wrapper"
                            variants={itemVariants}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{
                                opacity: 1,
                                y: 0,
                                transition: {
                                    delay: index * 0.05,
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 25
                                }
                            }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            whileHover={{
                                y: -5,
                                boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)",
                                transition: { duration: 0.2 }
                            }}
                        >
                            <GroupCard
                                group={group}
                                expenses={expenses.filter(expense => expense.groupId === group.id)}
                                currentUserId={currentUserId}
                                viewMode={viewMode}
                            />
                        </motion.div>
                    ))}
                </>
            ) : (
                <motion.div
                    className="empty-results"
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div
                        className="empty-icon"
                        animate={{
                            y: [0, -15, 0],
                            transition: {
                                repeat: Infinity,
                                duration: 2,
                                repeatType: "reverse"
                            }
                        }}
                    >
                        <Users size={60} />
                    </motion.div>
                    <h3>No groups found</h3>
                    {filterApplied ? (
                        <>
                            <p>Try adjusting your search or filters</p>
                            <motion.button
                                className="action-button"
                                onClick={clearFilters}
                                whileHover={{ y: -3, boxShadow: "0 8px 20px rgba(34, 197, 94, 0.3)" }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <X size={18} />
                                <span>Clear Filters</span>
                            </motion.button>
                        </>
                    ) : (
                        <>
                            <p>Create your first group to get started</p>
                            <motion.button
                                className="action-button create"
                                onClick={openCreateGroupModal}
                                whileHover={{ y: -3, boxShadow: "0 8px 20px rgba(34, 197, 94, 0.3)" }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Plus size={18} />
                                <span>Create New Group</span>
                            </motion.button>
                        </>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    </motion.div>
);

export default GroupGrid;
