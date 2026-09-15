import { motion } from 'framer-motion';
import { Card } from '../../../components/common/Card/Card';

/**
 * 7.4 -- one component per Account section, extracted verbatim.
 * Behaviour-preserving: identical markup and animation variants.
 */
const NotificationsSection = ({
    activeSection,
    handleNotificationChange,
    isEditing,
    notifications,
    profileData,
    sectionVariants,
}) => (
    <motion.div
        key="notifications"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={sectionVariants}
    >
        <Card className={`account-section ${activeSection === 'notifications' ? 'section-active' : ''}`}>
            <motion.h2
                className="section-title"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
            >
                Notifications
            </motion.h2>
            <div className="notification-grid">
                <div className="notification-group">
                    <h3>Groups and Friends</h3>
                    <div className="notification-option">
                        <label className="notification-label">When someone adds me to a group</label>
                        <div className="toggle-switch">
                            <input
                                type="checkbox"
                                id="groupAdd"
                                checked={notifications.groupAdd}
                                onChange={() => handleNotificationChange('groupAdd')}
                                disabled={!isEditing}
                            />
                            <label htmlFor="groupAdd" className="toggle-label"></label>
                        </div>
                    </div>
                    <div className="notification-option">
                        <label className="notification-label">When someone adds me as a friend</label>
                        <div className="toggle-switch">
                            <input
                                type="checkbox"
                                id="friendAdd"
                                checked={notifications.friendAdd}
                                onChange={() => handleNotificationChange('friendAdd')}
                                disabled={!isEditing}
                            />
                            <label htmlFor="friendAdd" className="toggle-label"></label>
                        </div>
                    </div>
                </div>
    
                <div className="notification-group">
                    <h3>Expenses</h3>
                    <div className="notification-option">
                        <label className="notification-label">When an expense is added</label>
                        <div className="toggle-switch">
                            <input
                                type="checkbox"
                                id="expenseAdd"
                                checked={notifications.expenseAdd}
                                onChange={() => handleNotificationChange('expenseAdd')}
                                disabled={!isEditing}
                            />
                            <label htmlFor="expenseAdd" className="toggle-label"></label>
                        </div>
                    </div>
                    <div className="notification-option">
                        <label className="notification-label">When an expense is edited/deleted</label>
                        <div className="toggle-switch">
                            <input
                                type="checkbox"
                                id="expenseEdit"
                                checked={notifications.expenseEdit}
                                onChange={() => handleNotificationChange('expenseEdit')}
                                disabled={!isEditing}
                            />
                            <label htmlFor="expenseEdit" className="toggle-label"></label>
                        </div>
                    </div>
                    <div className="notification-option">
                        <label className="notification-label">When someone comments on an expense</label>
                        <div className="toggle-switch">
                            <input
                                type="checkbox"
                                id="expenseComment"
                                checked={notifications.expenseComment}
                                onChange={() => handleNotificationChange('expenseComment')}
                                disabled={!isEditing}
                            />
                            <label htmlFor="expenseComment" className="toggle-label"></label>
                        </div>
                    </div>
                    <div className="notification-option">
                        <label className="notification-label">When an expense is due</label>
                        <div className="toggle-switch">
                            <input
                                type="checkbox"
                                id="expenseDue"
                                checked={notifications.expenseDue}
                                onChange={() => handleNotificationChange('expenseDue')}
                                disabled={!isEditing}
                            />
                            <label htmlFor="expenseDue" className="toggle-label"></label>
                        </div>
                    </div>
                    <div className="notification-option">
                        <label className="notification-label">When someone pays me</label>
                        <div className="toggle-switch">
                            <input
                                type="checkbox"
                                id="paymentReceived"
                                checked={notifications.paymentReceived}
                                onChange={() => handleNotificationChange('paymentReceived')}
                                disabled={!isEditing}
                            />
                            <label htmlFor="paymentReceived" className="toggle-label"></label>
                        </div>
                    </div>
                </div>
    
                <div className="notification-group">
                    <h3>News and Updates</h3>
                    <div className="notification-option">
                        <label className="notification-label">Monthly summary of my activity</label>
                        <div className="toggle-switch">
                            <input
                                type="checkbox"
                                id="monthlySummary"
                                checked={notifications.monthlySummary}
                                onChange={() => handleNotificationChange('monthlySummary')}
                                disabled={!isEditing}
                            />
                            <label htmlFor="monthlySummary" className="toggle-label"></label>
                        </div>
                    </div>
                    <div className="notification-option">
                        <label className="notification-label">CentiVerse news and updates</label>
                        <div className="toggle-switch">
                            <input
                                type="checkbox"
                                id="newsUpdates"
                                checked={notifications.newsUpdates}
                                onChange={() => handleNotificationChange('newsUpdates')}
                                disabled={!isEditing}
                            />
                            <label htmlFor="newsUpdates" className="toggle-label"></label>
                        </div>
                    </div>
                </div>
            </div>
    
            <div className="notification-channels">
                <h3 className="subsection-title">Notification Channels</h3>
                <div className="channel-options">
                    <div className="channel-option">
                        <div className="channel-info">
                            <span className="channel-icon">📱</span>
                            <div className="channel-details">
                                <h4>Push Notifications</h4>
                                <p>Receive alerts on your device</p>
                            </div>
                        </div>
                        <div className="toggle-switch">
                            <input
                                type="checkbox"
                                id="pushNotifications"
                                checked={true}
                                disabled={!isEditing}
                            />
                            <label htmlFor="pushNotifications" className="toggle-label"></label>
                        </div>
                    </div>
                    <div className="channel-option">
                        <div className="channel-info">
                            <span className="channel-icon">✉️</span>
                            <div className="channel-details">
                                <h4>Email Notifications</h4>
                                <p>Receive notifications to {profileData.email}</p>
                            </div>
                        </div>
                        <div className="toggle-switch">
                            <input
                                type="checkbox"
                                id="emailNotifications"
                                checked={true}
                                disabled={!isEditing}
                            />
                            <label htmlFor="emailNotifications" className="toggle-label"></label>
                        </div>
                    </div>
                    <div className="channel-option">
                        <div className="channel-info">
                            <span className="channel-icon">💬</span>
                            <div className="channel-details">
                                <h4>SMS Notifications</h4>
                                <p>Receive text messages to {profileData.phone}</p>
                            </div>
                        </div>
                        <div className="toggle-switch">
                            <input
                                type="checkbox"
                                id="smsNotifications"
                                checked={false}
                                disabled={!isEditing}
                            />
                            <label htmlFor="smsNotifications" className="toggle-label"></label>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    </motion.div>
);

export default NotificationsSection;
