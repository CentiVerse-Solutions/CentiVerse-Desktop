import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Users, Star, PlusCircle } from 'lucide-react';
import GroupList from '../../components/groups/GroupList/GroupList';
import { GroupsLoadingView, GroupsErrorView, GroupsEmptyView } from '../../features/groups/components/GroupsViews';
import NewGroupModal from '../../components/groups/NewGroupModal/NewGroupModal';
import { useGroups, useFriends, useRecentExpenses, useCreateGroup } from '../../data/hooks';
import { toLegacyExpenses, toLegacyFriends } from '../../data/legacy';
import './Groups.css';

const Groups = () => {
    const [groups, setGroups] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [friends, setFriends] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Data comes from the seam (§5.2). Loading, error and empty states below are
    // real query states rather than a simulated setTimeout.
    const groupsQuery = useGroups();
    const expensesQuery = useRecentExpenses(500);
    const friendsQuery = useFriends();
    const createGroup = useCreateGroup();

    const isLoading =
        groupsQuery.isPending || expensesQuery.isPending || friendsQuery.isPending;
    const error =
        groupsQuery.error ?? expensesQuery.error ?? friendsQuery.error ?? null;

    useEffect(() => {
        if (groupsQuery.data) setGroups(groupsQuery.data);
    }, [groupsQuery.data]);

    useEffect(() => {
        if (expensesQuery.data) setExpenses(toLegacyExpenses(expensesQuery.data));
    }, [expensesQuery.data]);

    useEffect(() => {
        if (friendsQuery.data) setFriends(toLegacyFriends(friendsQuery.data));
    }, [friendsQuery.data]);

    // Handle creating a new group
    // Creation goes through the port, which assigns the id and adds the viewer
    // as a member. §5.4: no component invents a user named "You".
    const handleCreateGroup = (groupData) => {
        createGroup.mutate({
            name: groupData.name,
            currency: groupData.currency ?? 'INR',
            members: groupData.members ?? [],
            ...(groupData.avatar ? { avatar: groupData.avatar } : {}),
        });
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
    if (isLoading) return <GroupsLoadingView />;

    if (error) return <GroupsErrorView error={error} onRetry={() => groupsQuery.refetch()} />;

    // Empty state
    if (groups.length === 0) {
        return (
            <GroupsEmptyView
                pageVariants={pageVariants}
                floatingVariants={floatingVariants}
                showCreateModal={showCreateModal}
                setShowCreateModal={setShowCreateModal}
                handleCreateGroup={handleCreateGroup}
                friends={friends}
            />
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
                                isOpen
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