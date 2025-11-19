import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Filter, Search, UserPlus, ArrowDownUp, DollarSign, Users, ChevronDown } from 'lucide-react';
import FriendsList from '../../components/friends/FriendsList/FriendsList';
import SearchBar from '../../components/common/SearchBar/SearchBar';
import {Button} from '../../components/common/Button/Button';
import AddFriendModal from '../../components/friends/AddFriendModal/AddFriendModal';
import FriendDetailsSidebar from '../../components/friends/FriendDetailsSidebar/FriendDetailsSidebar';
import { mockFriends } from '../../utils/mockData';
import './Friends.css';

const Friends = () => {
    const [friends, setFriends] = useState([]);
    const [filteredFriends, setFilteredFriends] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterBy, setFilterBy] = useState('all');
    const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [isDetailsSidebarOpen, setIsDetailsSidebarOpen] = useState(false);

    // Fetch friends data
    useEffect(() => {
        // In a real app, this would be a call to your API
        // For now, using mock data
        setFriends(mockFriends);
        setFilteredFriends(mockFriends);
    }, []);

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
            <div className="fr-header">
                <motion.h1
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 20,
                        delay: 0.1
                    }}
                    className="fr-title"
                >
                    <motion.span
                        className="fr-title-highlight"
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 0.8, delay: 0.5, ease: "easeInOut" }}
                    ></motion.span>
                    Friends
                </motion.h1>

                <motion.div
                    className="fr-summary"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div
                        className="fr-summary-card owes-you"
                        variants={cardVariants}
                        whileHover={{
                            scale: 1.03,
                            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.18)"
                        }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="fr-summary-icon">
                            <motion.div
                                animate={{ rotate: [0, -10, 10, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                            >
                                <DollarSign size={24} />
                            </motion.div>
                        </div>
                        <div>
                            <p className="fr-summary-label">Friends owe you</p>
                            <motion.p
                                className="fr-summary-value"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: staggerDelay * 1.5, duration: 0.3 }}
                            >
                                ${
                                    friends
                                        .filter(friend => friend.balance > 0)
                                        .reduce((sum, friend) => sum + friend.balance, 0)
                                        .toFixed(2)
                                }
                            </motion.p>
                        </div>
                    </motion.div>

                    <motion.div
                        className="fr-summary-card you-owe"
                        variants={cardVariants}
                        whileHover={{
                            scale: 1.03,
                            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.18)"
                        }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="fr-summary-icon">
                            <motion.div
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                            >
                                <ArrowDownUp size={24} />
                            </motion.div>
                        </div>
                        <div>
                            <p className="fr-summary-label">You owe friends</p>
                            <motion.p
                                className="fr-summary-value"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: staggerDelay * 2, duration: 0.3 }}
                            >
                                ${
                                    Math.abs(
                                        friends
                                            .filter(friend => friend.balance < 0)
                                            .reduce((sum, friend) => sum + friend.balance, 0)
                                    ).toFixed(2)
                                }
                            </motion.p>
                        </div>
                    </motion.div>

                    <motion.div
                        className="fr-summary-card total-friends"
                        variants={cardVariants}
                        whileHover={{
                            scale: 1.03,
                            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.18)"
                        }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="fr-summary-icon">
                            <motion.div
                                animate={{
                                    scale: [1, 1.1, 1],
                                    rotate: [0, 0, 0, 10, 0, -10, 0]
                                }}
                                transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
                            >
                                <Users size={24} />
                            </motion.div>
                        </div>
                        <div>
                            <p className="fr-summary-label">Total friends</p>
                            <motion.p
                                className="fr-summary-value"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: staggerDelay * 2.5, duration: 0.3 }}
                            >
                                {friends.length}
                            </motion.p>
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            <motion.div
                className="fr-actions"
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.4 }}
            >
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