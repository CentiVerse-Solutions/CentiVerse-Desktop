import { motion, AnimatePresence } from 'framer-motion';
import { Users, PlusCircle } from 'lucide-react';
import NewGroupModal from '../../../components/groups/NewGroupModal/NewGroupModal';

/**
 * 7.4 -- the Groups page's loading and error views, lifted verbatim so the
 * page stays under the 300-line limit. Behaviour-preserving.
 */
export const GroupsLoadingView = () => (
<div className="groups-loading">
        <div className="loading-animation">
            <motion.div
                className="loading-bubble"
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.7, 1, 0.7],
                    rotate: [0, 180, 360]
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    times: [0, 0.5, 1]
                }}
            />
            <motion.div
                className="loading-bubble secondary"
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.7, 1, 0.7],
                    rotate: [0, -180, -360]
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    times: [0, 0.5, 1],
                    delay: 0.3
                }}
            />
            <motion.div
                className="loading-bubble tertiary"
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.7, 1, 0.7],
                    rotate: [0, 180, 360]
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    times: [0, 0.5, 1],
                    delay: 0.6
                }}
            />
        </div>
        <motion.p
            animate={{
                opacity: [0.5, 1, 0.5]
            }}
            transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
            }}
        >
            Loading your experiences...
        </motion.p>
        <div className="loading-skeleton" aria-hidden="true">
            <div className="skeleton-header"></div>
            <div className="skeleton-cards">
                <div className="skeleton-card"></div>
                <div className="skeleton-card"></div>
                <div className="skeleton-card"></div>
            </div>
        </div>
    </div>
);

export const GroupsErrorView = ({ error, onRetry }) => (
<div className="groups-error">
        <motion.div
            className="error-icon-wrapper"
            animate={{
                rotate: [0, 10, -10, 10, 0],
            }}
            transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 4
            }}
        >
            <div className="error-icon">⚠️</div>
            <motion.div
                className="error-ripple"
                animate={{
                    scale: [1, 2],
                    opacity: [0.5, 0]
                }}
                transition={{
                    duration: 1,
                    repeat: Infinity,
                    repeatDelay: 1,
                    ease: "easeOut"
                }}
            />
        </motion.div>
        <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
        >
            Something went wrong
        </motion.h2>
        <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
        >
            {error}
        </motion.p>
        <motion.button
            className="action-btn primary glass-effect"
            onClick={() => window.location.reload()}
            whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(105, 162, 151, 0.5)" }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
        >
            Try Again
        </motion.button>
    </div>
);

export const GroupsEmptyView = ({
    pageVariants,
    floatingVariants,
    showCreateModal,
    setShowCreateModal,
    handleCreateGroup,
    friends,
}) => (
<motion.div
        className="groups-page"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
    >
        <div className="no-groups glass-card">
            <motion.div
                className="floating-elements"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
            >
                <motion.div
                    className="floating-element e1"
                    variants={floatingVariants}
                    animate="animate"
                />
                <motion.div
                    className="floating-element e2"
                    variants={floatingVariants}
                    animate="animate"
                    transition={{ delay: 0.5 }}
                />
                <motion.div
                    className="floating-element e3"
                    variants={floatingVariants}
                    animate="animate"
                    transition={{ delay: 1 }}
                />
            </motion.div>

            <motion.div
                className="create-group-icon-container"
                animate={{
                    y: [0, -15, 0],
                    rotate: [0, 5, 0, -5, 0]
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatDelay: 1
                }}
            >
                <div className="create-group-icon">
                    <Users size={54} />
                    <motion.div
                        className="icon-plus"
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.7, 1, 0.7]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        <PlusCircle size={24} />
                    </motion.div>
                </div>
            </motion.div>

            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                Begin Your Shared Journey
            </motion.h2>

            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                Create your first group to start splitting expenses and sharing memorable experiences
            </motion.p>

            <motion.button
                className="action-btn primary glass-effect"
                onClick={() => setShowCreateModal(true)}
                whileHover={{
                    scale: 1.05,
                    boxShadow: "0 10px 25px rgba(105, 162, 151, 0.5)",
                    y: -3
                }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <PlusCircle size={20} />
                Create Your First Group
            </motion.button>
        </div>

        {showCreateModal && (
            <NewGroupModal
                isOpen
                onClose={() => setShowCreateModal(false)}
                onCreateGroup={(groupData) => {
                    handleCreateGroup(groupData);
                    setShowCreateModal(false);
                }}
                friends={friends}
            />
        )}
    </motion.div>
);
