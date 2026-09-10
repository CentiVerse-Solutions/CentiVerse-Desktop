import { motion } from 'framer-motion';
import { Calendar, DollarSign, PlusCircle, Share2, Trash2, User } from 'lucide-react';
import { VIEWER_ID } from '../../../../shared/people/viewer';

/**
 * §7.4 -- extracted from GroupDetails verbatim. Behaviour-preserving: identical
 * markup, ARIA wiring and animation variants; only the state it reads now
 * arrives as props.
 */
const MembersTab = ({
    group,
    expenses,
    formatCurrency,
    handleSettleUp,
    handleRemoveMember,
    containerVariants,
    cardVariants,
}) => (
    <div
                            className="members-container"
                            role="tabpanel"
                            id="members-tab"
                            aria-labelledby="members-tab-btn"
                        >
                            <motion.div
                                className="members-header"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <h3 className="section-title">Group Members ({group.members.length})</h3>
                                <motion.button
                                    className="add-member-btn"
                                    whileHover={{ y: -3, boxShadow: "0 6px 20px rgba(105, 162, 151, 0.4)" }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <PlusCircle size={16} />
                                    <span>Add Member</span>
                                </motion.button>
                            </motion.div>
    
                            <motion.div
                                className="members-list"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                {group.members.map((member, index) => (
                                    <motion.div
                                        key={member.id}
                                        className="member-card"
                                        variants={cardVariants}
                                        custom={index}
                                        whileHover="hover"
                                        whileTap="tap"
                                    >
                                        <div className="member-avatar">
                                            <img src={member.avatar} alt={member.name} />
                                        </div>
                                        <div className="member-info">
                                            <h4 className="member-name">{member.name} {member.id === VIEWER_ID && <span className="member-you-badge">You</span>}</h4>
                                            <p className="member-email">{member.email}</p>
    
                                            <div className="member-stats">
                                                <div className="member-stat">
                                                    <div className="stat-label">
                                                        <DollarSign size={14} />
                                                        <span>Paid</span>
                                                    </div>
                                                    <div className="stat-value">
                                                        {formatCurrency(expenses.filter(e => e.paidBy.id === member.id).reduce((sum, e) => sum + e.amount, 0))}
                                                    </div>
                                                </div>
    
                                                <div className="member-stat">
                                                    <div className="stat-label">
                                                        <Calendar size={14} />
                                                        <span>Joined</span>
                                                    </div>
                                                    <div className="stat-value">
                                                        {new Date(group.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
    
                                        <div className="member-actions">
                                            {member.id !== VIEWER_ID && (
                                                <>
                                                    <motion.button
                                                        className="member-action-btn primary"
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleSettleUp(member.id)}
                                                    >
                                                        Settle
                                                    </motion.button>
                                                    <motion.button
                                                        className="member-action-btn danger"
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleRemoveMember(member.id)}
                                                    >
                                                        <Trash2 size={16} />
                                                    </motion.button>
                                                </>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
    
                            <motion.div
                                className="invite-member-section"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                            >
                                <h3 className="section-title">Invite New Members</h3>
                                <div className="invite-methods">
                                    <motion.div
                                        className="invite-method-card"
                                        whileHover={{ y: -5, boxShadow: "0 12px 30px rgba(0, 0, 0, 0.1)" }}
                                    >
                                        <div className="invite-method-icon">
                                            <Share2 size={24} />
                                        </div>
                                        <h4>Share Link</h4>
                                        <p>Send a link that allows anyone to join this group</p>
                                        <motion.button
                                            className="invite-btn"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            Create Link
                                        </motion.button>
                                    </motion.div>
    
                                    <motion.div
                                        className="invite-method-card"
                                        whileHover={{ y: -5, boxShadow: "0 12px 30px rgba(0, 0, 0, 0.1)" }}
                                    >
                                        <div className="invite-method-icon">
                                            <User size={24} />
                                        </div>
                                        <h4>Add Directly</h4>
                                        <p>Add members from your existing contacts</p>
                                        <motion.button
                                            className="invite-btn"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            Add Contact
                                        </motion.button>
                                    </motion.div>
                                </div>
                            </motion.div>
                        </div>
);

export default MembersTab;
