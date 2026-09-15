import { useAccount } from '../../features/account/useAccount';
import './Account.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from '../../components/common/Avatar/Avatar';
import { Button } from '../../components/common/Button/Button';
import { Card } from '../../components/common/Card/Card';
import { Badge } from '../../components/common/Badge/Badge';
import  SplitText  from '../../components/common/SplitText/SplitText';
import PersonalInfoSection from '../../features/account/components/PersonalInfoSection';
import PreferencesSection from '../../features/account/components/PreferencesSection';
import NotificationsSection from '../../features/account/components/NotificationsSection';
import PaymentMethodsSection from '../../features/account/components/PaymentMethodsSection';
import SecuritySection from '../../features/account/components/SecuritySection';
import SupportSection from '../../features/account/components/SupportSection';

const Account = () => {
    const {
        activeSection,
        activeTab,
        fileInputRef,
        formatDate,
        handleAddPaymentMethod,
        handleDeleteAccount,
        handleEditToggle,
        handleExportData,
        handleFileChange,
        handleInputChange,
        handleLogout,
        handleNotificationChange,
        handleProfilePicClick,
        handleRemovePaymentMethod,
        handleSaveChanges,
        handleSetDefaultPaymentMethod,
        handleSetTab,
        handleToggleDarkMode,
        hoverScale,
        isEditing,
        itemVariants,
        notifications,
        pageVariants,
        paymentMethods,
        profileData,
        saveSuccess,
        sectionVariants,
        securitySettings,
        setSecuritySettings,
        user,
    } = useAccount();

    const renderTabContent = () => {
        switch (activeTab) {
            case 'personal':
                return (
                    <PersonalInfoSection
                        activeSection={activeSection}
                        handleDeleteAccount={handleDeleteAccount}
                        handleExportData={handleExportData}
                        handleInputChange={handleInputChange}
                        isEditing={isEditing}
                        itemVariants={itemVariants}
                        profileData={profileData}
                        sectionVariants={sectionVariants}
                    />
                );
            case 'preferences':
                return (
                    <PreferencesSection
                        activeSection={activeSection}
                        handleInputChange={handleInputChange}
                        handleToggleDarkMode={handleToggleDarkMode}
                        isEditing={isEditing}
                        itemVariants={itemVariants}
                        profileData={profileData}
                        sectionVariants={sectionVariants}
                    />
                );
            case 'notifications':
                return (
                    <NotificationsSection
                        activeSection={activeSection}
                        handleNotificationChange={handleNotificationChange}
                        isEditing={isEditing}
                        notifications={notifications}
                        profileData={profileData}
                        sectionVariants={sectionVariants}
                    />
                );
            case 'payment':
                return (
                    <PaymentMethodsSection
                        activeSection={activeSection}
                        handleAddPaymentMethod={handleAddPaymentMethod}
                        handleRemovePaymentMethod={handleRemovePaymentMethod}
                        handleSetDefaultPaymentMethod={handleSetDefaultPaymentMethod}
                        hoverScale={hoverScale}
                        isEditing={isEditing}
                        itemVariants={itemVariants}
                        paymentMethods={paymentMethods}
                        sectionVariants={sectionVariants}
                    />
                );
            case 'security':
                return (
                    <SecuritySection
                        activeSection={activeSection}
                        formatDate={formatDate}
                        isEditing={isEditing}
                        sectionVariants={sectionVariants}
                        securitySettings={securitySettings}
                        setSecuritySettings={setSecuritySettings}
                    />
                );
            case 'support':
                return (
                    <SupportSection
                        activeSection={activeSection}
                        itemVariants={itemVariants}
                        sectionVariants={sectionVariants}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <motion.div
            className="account-page"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
        >
            <AnimatePresence>
                {saveSuccess && (
                    <motion.div
                        className="save-success-message"
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                    >
                        <span className="success-icon">✓</span>
                        Profile updated successfully!
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                className="account-header"
                variants={sectionVariants}
            >
                <h1 className="account-title">
                    <SplitText>My Account</SplitText>
                </h1>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                        variant={isEditing ? "primary" : "outlined"}
                        onClick={handleEditToggle}
                    >
                        {isEditing ? 'Cancel Editing' : 'Edit Profile'}
                    </Button>
                </motion.div>
            </motion.div>

            <div className="account-content">
                <motion.div
                    className="account-sidebar"
                    variants={sectionVariants}
                >
                    <motion.div
                        className="profile-pic-container"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                    >
                        <motion.div
                            className={`profile-pic ${isEditing ? 'editable' : ''}`}
                            onClick={isEditing ? handleProfilePicClick : null}
                            whileHover={isEditing ? { scale: 1.1, rotate: 5 } : {}}
                            whileTap={isEditing ? { scale: 0.95 } : {}}
                        >
                            <Avatar
                                src={profileData.profilePic}
                                alt={profileData.name}
                                size="large"
                            />
                            {isEditing && (
                                <motion.div
                                    className="edit-overlay"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <span className="icon">📷</span>
                                    <span>Change</span>
                                </motion.div>
                            )}
                        </motion.div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                            accept="image/*"
                        />
                    </motion.div>

                    <motion.div
                        className="user-info"
                        variants={sectionVariants}
                    >
                        <motion.h2
                            className="user-name"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.3 }}
                        >
                            {profileData.name}
                        </motion.h2>
                        <motion.p
                            className="user-email"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.3 }}
                        >
                            {profileData.email}
                        </motion.p>
                    </motion.div>

                    <motion.div
                        className="account-menu"
                        variants={sectionVariants}
                    >
                        {[
                            { id: 'personal', icon: '👤', label: 'Personal Info' },
                            { id: 'preferences', icon: '⚙️', label: 'Preferences' },
                            { id: 'notifications', icon: '🔔', label: 'Notifications' },
                            { id: 'payment', icon: '💳', label: 'Payment Methods' },
                            { id: 'security', icon: '🔒', label: 'Security' },
                            { id: 'support', icon: '💬', label: 'Support' }
                        ].map((item, index) => (
                            <motion.button
                                key={item.id}
                                className={`menu-item ${activeTab === item.id ? 'active' : ''}`}
                                onClick={() => handleSetTab(item.id)}
                                variants={itemVariants}
                                custom={index}
                                whileHover={{ x: 8 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <span className="menu-icon">{item.icon}</span>
                                <span>{item.label}</span>
                            </motion.button>
                        ))}
                        <motion.button
                            className="menu-item danger"
                            onClick={handleLogout}
                            variants={itemVariants}
                            custom={6}
                            whileHover={{ x: 8, backgroundColor: 'rgba(229, 57, 53, 0.15)' }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <span className="menu-icon">🚪</span>
                            <span>Logout</span>
                        </motion.button>
                    </motion.div>
                </motion.div>

                <div className="account-main">
                    <AnimatePresence mode="wait">
                        {renderTabContent()}
                    </AnimatePresence>

                    <AnimatePresence>
                        {isEditing && (
                            <motion.div
                                className="account-actions-footer"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                            >
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button variant="primary" onClick={handleSaveChanges}>
                                        Save Changes
                                    </Button>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button variant="outlined" onClick={handleEditToggle}>
                                        Cancel
                                    </Button>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
};

export default Account;