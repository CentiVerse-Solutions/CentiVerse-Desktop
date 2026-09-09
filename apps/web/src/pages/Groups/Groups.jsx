import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Users, Star, PlusCircle } from 'lucide-react';
import GroupList from '../../components/groups/GroupList/GroupList';
import NewGroupModal from '../../components/groups/NewGroupModal/NewGroupModal';
import { mockGroups, mockExpenses, mockFriends } from '../../utils/mockData';
import './Groups.css';

const Groups = () => {
    const [groups, setGroups] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [friends, setFriends] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Fetch data on mount - replace with actual API calls later
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 800));

                // Use mock data for now
                setGroups(mockGroups);
                setExpenses(mockExpenses);
                setFriends(mockFriends);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setError('Failed to load data. Please try again later.');
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Handle creating a new group
    const handleCreateGroup = (groupData) => {
        // Generate an ID and add to groups
        const newGroup = {
            ...groupData,
            id: Math.max(...groups.map(g => g.id), 0) + 1,
            createdAt: new Date().toISOString(),
            members: [...groupData.members, {
                id: 1,
                name: "You",
                email: "you@example.com",
                avatar: "https://randomuser.me/api/portraits/men/32.jpg",
            }]
        };

        // Update state with new group
        setGroups(prevGroups => [newGroup, ...prevGroups]);
    };

    // Stats summary based on groups data
    const stats = {
        totalGroups: groups.length,
        totalMembers: [...new Set(groups.flatMap(g => g.members.map(m => m.id)))].length,
        activeGroups: groups.filter(g => {
            const groupExpenses = expenses.filter(e => e.groupId === g.id);
            return groupExpenses.some(e => {
                const date = new Date(e.date);
                const now = new Date();
                const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
                return date >= thirtyDaysAgo;
            });
        }).length
    };

    // Animation variants
    const pageVariants = {
        initial: { opacity: 0 },
        animate: {
            opacity: 1,
            transition: {
                duration: 0.5,
                staggerChildren: 0.1
            }
        },
        exit: { opacity: 0 }
    };

    const itemVariants = {
        initial: { y: 20, opacity: 0 },
        animate: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 300, damping: 24 }
        },
        exit: { y: -20, opacity: 0 }
    };

    const floatingVariants = {
        animate: {
            y: [0, -10, 0],
            transition: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    // Loading state
    if (isLoading) {
        return (
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
    }

    // Error state
    if (error) {
        return (
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
    }

    // Empty state
    if (groups.length === 0) {
        return (
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
    }

    // Main content - Groups list
    return (
        <motion.div
            className="groups-page"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
        >
            <LayoutGroup>
                <motion.div
                    className="groups-hero"
                    variants={itemVariants}
                >
                    <div className="hero-content">
                        <h1>Your Groups</h1>
                        <p>Manage shared expenses and create lasting memories together</p>
                    </div>
                    <div className="hero-decoration">
                        <motion.div
                            className="hero-blob"
                            animate={{
                                scale: [1, 1.05, 1],
                                rotate: [0, 5, 0]
                            }}
                            transition={{
                                duration: 5,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                    </div>
                </motion.div>

                <motion.div
                    className="stats-cards"
                    variants={itemVariants}
                >
                    <motion.div
                        className="stat-card"
                        whileHover={{ y: -5, boxShadow: "0 15px 30px rgba(0,0,0,0.1)" }}
                    >
                        <div className="stat-icon">
                            <Users size={20} />
                        </div>
                        <div className="stat-content">
                            <motion.h3
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                {stats.totalGroups}
                            </motion.h3>
                            <p>Total Groups</p>
                        </div>
                    </motion.div>

                    <motion.div
                        className="stat-card"
                        whileHover={{ y: -5, boxShadow: "0 15px 30px rgba(0,0,0,0.1)" }}
                    >
                        <div className="stat-icon">
                            <Star size={20} />
                        </div>
                        <div className="stat-content">
                            <motion.h3
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                {stats.activeGroups}
                            </motion.h3>
                            <p>Active Groups</p>
                        </div>
                    </motion.div>

                    <motion.div
                        className="stat-card"
                        whileHover={{ y: -5, boxShadow: "0 15px 30px rgba(0,0,0,0.1)" }}
                    >
                        <div className="stat-icon">
                            <Users size={20} />
                        </div>
                        <div className="stat-content">
                            <motion.h3
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                {stats.totalMembers}
                            </motion.h3>
                            <p>People</p>
                        </div>
                    </motion.div>
                </motion.div>

                <GroupList
                    groups={groups}
                    expenses={expenses}
                    friends={friends}
                    onCreateGroup={handleCreateGroup}
                />
            </LayoutGroup>

            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="modal-container"
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 50, scale: 0.9 }}
                            transition={{
                                type: "spring",
                                damping: 30,
                                stiffness: 300
                            }}
                        >
                            <NewGroupModal
                                onClose={() => setShowCreateModal(false)}
                                onCreateGroup={(groupData) => {
                                    handleCreateGroup(groupData);
                                    setShowCreateModal(false);
                                }}
                                friends={friends}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Groups;