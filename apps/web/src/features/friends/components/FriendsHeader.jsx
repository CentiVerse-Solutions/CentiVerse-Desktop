import { motion } from 'framer-motion';
import { ArrowDownUp, DollarSign, Users } from 'lucide-react';

/**
 * 7.4 -- extracted from Friends verbatim (behaviour-preserving).
 */
const FriendsHeader = ({
    cardVariants,
    containerVariants,
    friends,
    staggerDelay,
}) => (
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
);

export default FriendsHeader;
