import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Filter, Search, UserPlus, ArrowDownUp, DollarSign, Users, ChevronDown } from 'lucide-react';
import FriendsList from '../../components/friends/FriendsList/FriendsList';
import SearchBar from '../../components/common/SearchBar/SearchBar';
import {Button} from '../../components/common/Button/Button';
import AddFriendModal from '../../components/friends/AddFriendModal/AddFriendModal';
import FriendDetailsSidebar from '../../components/friends/FriendDetailsSidebar/FriendDetailsSidebar';
import { useFriends } from '../../data/hooks';
import { toLegacyFriends } from '../../data/legacy';
import AsyncBoundary from '../../shared/ui/AsyncBoundary';
import './Friends.css';
import FriendsHeader from '../../features/friends/components/FriendsHeader';
import FriendsSearchFilter from '../../features/friends/components/FriendsSearchFilter';

const Friends = () => {
    const [friends, setFriends] = useState([]);
    const [filteredFriends, setFilteredFriends] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterBy, setFilterBy] = useState('all');
    const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [isDetailsSidebarOpen, setIsDetailsSidebarOpen] = useState(false);

    // Friends and their balances come from the seam; balances are derived by
    // @centiverse/core, not the float that used to sit in the mock data.
    const friendsQuery = useFriends();

    useEffect(() => {
        if (!friendsQuery.data) return;
        const list = toLegacyFriends(friendsQuery.data);
        setFriends(list);
        setFilteredFriends(list);
    }, [friendsQuery.data]);

    // Filter friends based on search query and filter option
    useEffect(() => {
        let result = [...friends];

        // Apply search filter
        if (searchQuery) {
            result = result.filter(friend =>
                friend.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply category filter
        if (filterBy !== 'all') {
            switch (filterBy) {
                case 'owesYou':
                    result = result.filter(friend => friend.balance > 0);
                    break;
                case 'youOwe':
                    result = result.filter(friend => friend.balance < 0);
                    break;
                case 'settled':
                    result = result.filter(friend => friend.balance === 0);
                    break;
                default:
                    break;
            }
        }

        setFilteredFriends(result);
    }, [searchQuery, filterBy, friends]);

    const handleSearchChange = (query) => {
        setSearchQuery(query);
    };

    const handleFilterChange = (filter) => {
        setFilterBy(filter);
    };

    const handleAddFriend = (newFriend) => {
        console.log("Adding new friend:", newFriend);
        setFriends(prev => [...prev, newFriend]);
        setIsAddFriendModalOpen(false);
    };

    const handleFriendSelect = (friend) => {
        setSelectedFriend(friend);
        setIsDetailsSidebarOpen(true);
    };

    const handleCloseSidebar = () => {
        setIsDetailsSidebarOpen(false);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        },
        exit: {
            opacity: 0,
            transition: {
                staggerChildren: 0.05,
                staggerDirection: -1
            }
        }
    };

    const cardVariants = {
        hidden: { y: 50, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 12
            }
        },
        exit: {
            y: -20,
            opacity: 0,
            transition: { duration: 0.2 }
        }
    };

    const fadeInUp = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 25
            }
        }
    };

    const staggerDelay = 0.1;

    return (
        <motion.div
            className="fr-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            <FriendsHeader
                cardVariants={cardVariants}
                containerVariants={containerVariants}
                friends={friends}
                staggerDelay={staggerDelay}
            />

            <motion.div
                className="fr-actions"
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.4 }}
            >
                <FriendsSearchFilter
                    filterBy={filterBy}
                    friends={friends}
                    handleFilterChange={handleFilterChange}
                    handleSearchChange={handleSearchChange}
                />

                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7, duration: 0.3 }}
                >
                    <Button
                        onClick={() => {
                            console.log("Opening add friend modal");
                            setIsAddFriendModalOpen(true);
                        }}
                        className="fr-add-friend-btn"
                        variant="primary"
                        icon={<UserPlus size={18} />}
                    >
                        <motion.span
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.8 }}
                        >
                            Add Friend
                        </motion.span>
                    </Button>
                </motion.div>
            </motion.div>

            <motion.div
                className="fr-content"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
            >
                <FriendsList
                    friends={filteredFriends}
                    onFriendSelect={handleFriendSelect}
                />

                {filteredFriends.length === 0 && (
                    <motion.div
                        className="fr-no-friends-message"
                        variants={fadeInUp}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.2 }}
                    >
                        {searchQuery || filterBy !== 'all' ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3, duration: 0.3 }}
                            >
                                <motion.div className="fr-no-results-icon">
                                    <motion.div
                                        animate={{ rotate: [0, 10, -10, 10, 0] }}
                                        transition={{ duration: 4, repeat: Infinity, repeatDelay: 1 }}
                                    >
                                        <Search size={48} strokeWidth={1} />
                                    </motion.div>
                                </motion.div>
                                <p>No friends match your search or filter criteria.</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3, duration: 0.3 }}
                            >
                                <motion.div className="fr-empty-state-icon">
                                    <motion.div
                                        animate={{
                                            y: [0, -10, 0],
                                            rotate: [0, 0, 0, 5, 0, -5, 0]
                                        }}
                                        transition={{ duration: 5, repeat: Infinity, repeatDelay: 1 }}
                                    >
                                        <Users size={64} strokeWidth={1} />
                                    </motion.div>
                                </motion.div>
                                <p>You haven't added any friends yet.</p>
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Button
                                        onClick={() => setIsAddFriendModalOpen(true)}
                                        variant="primary"
                                        className="fr-first-friend-btn"
                                    >
                                        Add Your First Friend
                                    </Button>
                                </motion.div>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </motion.div>

            {/* Add Friend Modal */}
            <AddFriendModal
                isOpen={isAddFriendModalOpen}
                onClose={() => setIsAddFriendModalOpen(false)}
                onAddFriend={handleAddFriend}
            />

            {/* Friend Details Sidebar */}
            {selectedFriend && (
                <FriendDetailsSidebar
                    friend={selectedFriend}
                    isOpen={isDetailsSidebarOpen}
                    onClose={handleCloseSidebar}
                />
            )}
        </motion.div>
    );
};

export default Friends; 