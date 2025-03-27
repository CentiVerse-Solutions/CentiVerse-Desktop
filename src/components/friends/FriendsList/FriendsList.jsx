import React from 'react';
import { motion } from 'framer-motion';
import FriendCard from '../FriendCard/FriendCard';
import './FriendsList.css';

const FriendsList = ({ friends, onFriendSelect }) => {
    // Animation variants
    const listVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: 'spring',
                stiffness: 100,
                damping: 12
            }
        }
    };

    return (
        <motion.div
            className="fr-list"
            variants={listVariants}
            initial="hidden"
            animate="visible"
        >
            {friends.map((friend, index) => (
                <motion.div
                    key={friend.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onFriendSelect(friend)}
                >
                    <FriendCard
                        friend={friend}
                        index={index}
                    />
                </motion.div>
            ))}
        </motion.div>
    );
};

export default FriendsList;