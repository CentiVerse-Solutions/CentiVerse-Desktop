import React, { useState, useRef, useContext, useEffect } from 'react';
import './Account.css';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import { Avatar } from '../../components/common/Avatar/Avatar';
import { Button } from '../../components/common/Button/Button';
import { Card } from '../../components/common/Card/Card';
import { Badge } from '../../components/common/Badge/Badge';
import  SplitText  from '../../components/common/SplitText/SplitText';

// Import mock currencies for dropdown
import { SUPPORTED_CURRENCIES as mockCurrencies } from '../../shared/currencies';
import PersonalInfoSection from '../../features/account/components/PersonalInfoSection';
import PreferencesSection from '../../features/account/components/PreferencesSection';
import NotificationsSection from '../../features/account/components/NotificationsSection';
import PaymentMethodsSection from '../../features/account/components/PaymentMethodsSection';
import SecuritySection from '../../features/account/components/SecuritySection';
import SupportSection from '../../features/account/components/SupportSection';

// Use a default import approach that's safer
const defaultAvatar = 'https://via.placeholder.com/150';

const Account = () => {
    const { user, logout, updateUserProfile } = useContext(AuthContext);
    const { theme, toggleTheme } = useContext(ThemeContext);
    const fileInputRef = useRef(null);
    const [activeTab, setActiveTab] = useState('personal');
    const [isEditing, setIsEditing] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [activeSection, setActiveSection] = useState(null);

    // Enhanced animation when a section becomes active
    useEffect(() => {
        if (activeSection) {
            const timer = setTimeout(() => {
                setActiveSection(null);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [activeSection]);

    const [profileData, setProfileData] = useState({
        name: user?.name || 'John Doe',
        email: user?.email || 'john.doe@example.com',
        phone: user?.phone || '+91 9876543210',
        upiId: user?.upiId || 'johndoe@upi',
        currency: user?.currency || 'INR',
        language: user?.language || 'English',
        darkMode: theme === 'dark',
        profilePic: user?.profilePic || defaultAvatar
    });

    // Notification settings
    const [notifications, setNotifications] = useState({
        groupAdd: user?.notifications?.groupAdd || true,
        friendAdd: user?.notifications?.friendAdd || true,
        expenseAdd: user?.notifications?.expenseAdd || false,
        expenseEdit: user?.notifications?.expenseEdit || false,
        expenseComment: user?.notifications?.expenseComment || false,
        expenseDue: user?.notifications?.expenseDue || true,
        paymentReceived: user?.notifications?.paymentReceived || true,
        monthlySummary: user?.notifications?.monthlySummary || true,
        newsUpdates: user?.notifications?.newsUpdates || true
    });

    // Payment methods state
    const [paymentMethods, setPaymentMethods] = useState([
        { id: 1, type: 'UPI', details: profileData.upiId, isDefault: true },
        { id: 2, type: 'Bank Account', details: 'XXXX XXXX 1234', isDefault: false },
        { id: 3, type: 'PayTM', details: profileData.phone, isDefault: false }
    ]);

    // Security settings
    const [securitySettings, setSecuritySettings] = useState({
        twoFactorAuth: false,
        loginNotifications: true,
        passwordLastChanged: '2025-01-15T10:00:00'
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData({
            ...profileData,
            [name]: value
        });
    };

    const handleNotificationChange = (key) => {
        setNotifications({
            ...notifications,
            [key]: !notifications[key]
        });
    };

    const handleToggleDarkMode = () => {
        const newDarkMode = !profileData.darkMode;
        setProfileData({
            ...profileData,
            darkMode: newDarkMode
        });
        toggleTheme(newDarkMode ? 'dark' : 'light');
    };

    const handleProfilePicClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setProfileData({
                    ...profileData,
                    profilePic: event.target.result
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        if (isEditing) {
            // If we're exiting edit mode without saving, reset to original data
            setProfileData({
                name: user?.name || 'John Doe',
                email: user?.email || 'john.doe@example.com',
                phone: user?.phone || '+91 9876543210',
                upiId: user?.upiId || 'johndoe@upi',
                currency: user?.currency || 'INR',
                language: user?.language || 'English',
                darkMode: theme === 'dark',
                profilePic: user?.profilePic || defaultAvatar
            });
        }
    };

    const handleSaveChanges = () => {
        // Update the first payment method with the new UPI ID
        const updatedPaymentMethods = [...paymentMethods];
        const upiMethod = updatedPaymentMethods.find(method => method.type === 'UPI');
        if (upiMethod) {
            upiMethod.details = profileData.upiId;
        }
        setPaymentMethods(updatedPaymentMethods);

        // In a real app, you would call an API to update the user profile
        updateUserProfile({
            ...profileData,
            notifications
        });
        setIsEditing(false);

        // Show success message
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
    };

    const handleLogout = () => {
        logout();
        // Redirect to login page or home page
    };

    const handleExportData = () => {
        // In a real app, you would generate a data export file for the user
        alert('Your data export has been initiated. You will receive an email with your data shortly.');
    };

    const handleDeleteAccount = () => {
        if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            // In a real app, you would call an API to delete the user account
            alert('Your account has been scheduled for deletion. You will be logged out now.');
            logout();
        }
    };

    const handleSetTab = (tab) => {
        setActiveTab(tab);
        setActiveSection(tab);
    };

    const handleAddPaymentMethod = () => {
        if (isEditing) {
            const newMethod = {
                id: paymentMethods.length + 1,
                type: 'UPI',
                details: 'New payment method',
                isDefault: false
            };
            setPaymentMethods([...paymentMethods, newMethod]);
        }
    };

    const handleRemovePaymentMethod = (id) => {
        if (isEditing) {
            setPaymentMethods(paymentMethods.filter(method => method.id !== id));
        }
    };

    const handleSetDefaultPaymentMethod = (id) => {
        if (isEditing) {
            setPaymentMethods(paymentMethods.map(method => ({
                ...method,
                isDefault: method.id === id
            })));
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    };

    // Framer Motion variants
    const pageVariants = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
        exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
    };

    const sectionVariants = {
        initial: { opacity: 0, y: 15 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
        exit: { opacity: 0, y: -15, transition: { duration: 0.3 } }
    };

    const itemVariants = {
        initial: { opacity: 0, x: -10 },
        animate: (custom) => ({
            opacity: 1,
            x: 0,
            transition: {
                delay: custom * 0.1,
                duration: 0.3
            }
        })
    };

    const hoverScale = {
        scale: 1.03,
        transition: { duration: 0.2 }
    };

    // Content for each tab
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