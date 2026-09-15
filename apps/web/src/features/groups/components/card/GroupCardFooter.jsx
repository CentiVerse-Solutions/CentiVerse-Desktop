import { motion } from 'framer-motion';

/**
 * 7.4 -- split out verbatim (behaviour-preserving).
 */
const GroupCardFooter = ({
    group,
    isHovered,
}) => (
    <motion.div
        className="group-card-footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
    >
        <div className="group-member-avatars">
            {group.members.slice(0, 4).map((member, index) => (
                <motion.div
                    key={member.id}
                    className="group-member-avatar"
                    style={{ zIndex: 10 - index }}
                    initial={{ x: -5, opacity: 0 }}
                    animate={{
                        x: 0,
                        opacity: 1,
                        transition: { delay: 0.1 * index }
                    }}
                    whileHover={{ y: -5, scale: 1.2, zIndex: 20 }}
                >
                    <img src={member.avatar} alt={member.name} />
                    <motion.span
                        className="member-tooltip"
                        initial={{ opacity: 0, y: 10 }}
                        whileHover={{ opacity: 1, y: 0 }}
                    >
                        {member.name}
                    </motion.span>
                </motion.div>
            ))}
            {group.members.length > 4 && (
                <motion.div
                    className="group-member-avatar more"
                    initial={{ x: -5, opacity: 0 }}
                    animate={{
                        x: 0,
                        opacity: 1,
                        transition: { delay: 0.4 }
                    }}
                    whileHover={{ y: -5 }}
                >
                    +{group.members.length - 4}
                </motion.div>
            )}
        </div>
    
        <motion.div
            className="view-group-btn"
            whileHover={{
                scale: 1.05,
                boxShadow: "0 8px 20px rgba(34, 197, 94, 0.3)"
            }}
            whileTap={{ scale: 0.95 }}
        >
            <span>View Details</span>
            <motion.div
                className="btn-arrow"
                animate={{ x: isHovered ? 5 : 0 }}
                transition={{ type: "spring", stiffness: 400 }}
            >
                →
            </motion.div>
        </motion.div>
    </motion.div>
);

export default GroupCardFooter;
