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
                    <motion.div
                        key="personal"
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={sectionVariants}
                    >
                        <Card className={`account-section ${activeSection === 'personal' ? 'section-active' : ''}`}>
                            <motion.h2
                                className="section-title"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                Personal Information
                            </motion.h2>
                            <motion.div className="form-grid">
                                {[
                                    { id: 'name', label: 'Full Name', type: 'text', value: profileData.name },
                                    { id: 'email', label: 'Email Address', type: 'email', value: profileData.email },
                                    { id: 'phone', label: 'Phone Number', type: 'tel', value: profileData.phone },
                                    { id: 'upiId', label: 'UPI ID', type: 'text', value: profileData.upiId }
                                ].map((field, index) => (
                                    <motion.div
                                        className="form-group"
                                        key={field.id}
                                        variants={itemVariants}
                                        custom={index}
                                        whileHover={isEditing ? { y: -4 } : {}}
                                    >
                                        <label htmlFor={field.id}>{field.label}</label>
                                        <motion.input
                                            type={field.type}
                                            id={field.id}
                                            name={field.id}
                                            value={field.value}
                                            onChange={handleInputChange}
                                            disabled={!isEditing}
                                            className={isEditing ? 'editable' : ''}
                                            animate={isEditing ? {
                                                boxShadow: ['0 2px 4px rgba(0, 0, 0, 0.05)', '0 4px 8px rgba(105, 162, 151, 0.15)', '0 2px 4px rgba(0, 0, 0, 0.05)'],
                                            } : {}}
                                            transition={{
                                                duration: 2,
                                                repeat: Infinity,
                                                repeatType: 'reverse'
                                            }}
                                        />
                                    </motion.div>
                                ))}
                            </motion.div>
                        </Card>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.4 }}
                        >
                            <Card className="account-section">
                                <motion.h2
                                    className="section-title"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: 0.1 }}
                                >
                                    Account Actions
                                </motion.h2>
                                <div className="account-actions">
                                    <motion.div
                                        className="action-group"
                                        variants={itemVariants}
                                        custom={0}
                                    >
                                        <h3>Data Management</h3>
                                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                            <Button variant="outlined" onClick={handleExportData}>
                                                <motion.span
                                                    className="button-icon"
                                                    animate={{ y: [0, -3, 0] }}
                                                    transition={{ duration: 1.5, repeat: Infinity }}
                                                >
                                                    📤
                                                </motion.span>
                                                <span>Export my data</span>
                                            </Button>
                                        </motion.div>
                                    </motion.div>
                                    <motion.div
                                        className="action-group"
                                        variants={itemVariants}
                                        custom={1}
                                    >
                                        <h3>Danger Zone</h3>
                                        <motion.div
                                            whileHover={{
                                                scale: 1.03,
                                                transition: { duration: 0.2 }
                                            }}
                                            whileTap={{ scale: 0.97 }}
                                        >
                                            <Button variant="danger" onClick={handleDeleteAccount}>
                                                <motion.span
                                                    className="button-icon"
                                                    animate={{ rotate: [0, 10, 0, -10, 0] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                >
                                                    🗑️
                                                </motion.span>
                                                <span>Delete my account</span>
                                            </Button>
                                        </motion.div>
                                    </motion.div>
                                </div>
                            </Card>
                        </motion.div>
                    </motion.div>
                );

            case 'preferences':
                return (
                    <motion.div
                        key="preferences"
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={sectionVariants}
                    >
                        <Card className={`account-section ${activeSection === 'preferences' ? 'section-active' : ''}`}>
                            <motion.h2
                                className="section-title"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                Preferences
                            </motion.h2>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label htmlFor="currency">Default Currency</label>
                                    <select
                                        id="currency"
                                        name="currency"
                                        value={profileData.currency}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                        className={isEditing ? 'editable' : ''}
                                    >
                                        {mockCurrencies.map(currency => (
                                            <option key={currency.code} value={currency.code}>
                                                {currency.name} ({currency.symbol})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="language">Language</label>
                                    <select
                                        id="language"
                                        name="language"
                                        value={profileData.language}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                        className={isEditing ? 'editable' : ''}
                                    >
                                        <option value="English">English</option>
                                        <option value="Hindi">Hindi</option>
                                        <option value="Spanish">Spanish</option>
                                        <option value="French">French</option>
                                        <option value="German">German</option>
                                        <option value="Japanese">Japanese</option>
                                        <option value="Chinese">Chinese</option>
                                    </select>
                                </div>
                                <div className="form-group toggle-group">
                                    <label htmlFor="darkMode">Dark Mode</label>
                                    <div className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            id="darkMode"
                                            checked={profileData.darkMode}
                                            onChange={handleToggleDarkMode}
                                            disabled={!isEditing}
                                        />
                                        <label htmlFor="darkMode" className="toggle-label"></label>
                                    </div>
                                </div>
                            </div>

                            <div className="preference-categories">
                                <h3 className="subsection-title">Default Categories</h3>
                                <p className="subsection-description">
                                    Select your most used expense categories to appear at the top when adding expenses.
                                </p>
                                <motion.div
                                    className="category-chips"
                                    variants={{
                                        animate: {
                                            transition: {
                                                staggerChildren: 0.1
                                            }
                                        }
                                    }}
                                >
                                    {[
                                        { icon: '🍔', name: 'Food & Drink', selected: true },
                                        { icon: '🚕', name: 'Transportation', selected: true },
                                        { icon: '🏨', name: 'Accommodation', selected: false },
                                        { icon: '🛒', name: 'Groceries', selected: true },
                                        { icon: '🎬', name: 'Entertainment', selected: false },
                                        { icon: '💡', name: 'Utilities', selected: false }
                                    ].map((category, index) => (
                                        <motion.div
                                            key={category.name}
                                            className={`category-chip ${category.selected ? 'selected' : ''}`}
                                            variants={itemVariants}
                                            custom={index}
                                            whileHover={{
                                                scale: 1.05,
                                                y: -5,
                                                boxShadow: '0 6px 10px rgba(0, 0, 0, 0.1)'
                                            }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <span className="category-icon">{category.icon}</span>
                                            <span>{category.name}</span>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </div>
                        </Card>
                    </motion.div>
                );

            case 'notifications':
                return (
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

            case 'payment':
                return (
                    <motion.div
                        key="payment"
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={sectionVariants}
                    >
                        <Card className={`account-section ${activeSection === 'payment' ? 'section-active' : ''}`}>
                            <div className="section-header">
                                <motion.h2
                                    className="section-title"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    Payment Methods
                                </motion.h2>
                                {isEditing && (
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <Button variant="outlined" size="small" onClick={handleAddPaymentMethod}>
                                            <span className="button-icon">+</span>
                                            Add Method
                                        </Button>
                                    </motion.div>
                                )}
                            </div>

                            <motion.div
                                className="payment-methods-list"
                                variants={{
                                    animate: {
                                        transition: {
                                            staggerChildren: 0.1
                                        }
                                    }
                                }}
                            >
                                <AnimatePresence>
                                    {paymentMethods.map((method, index) => (
                                        <motion.div
                                            key={method.id}
                                            className="payment-method-item"
                                            variants={itemVariants}
                                            custom={index}
                                            whileHover={hoverScale}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20, scale: 0.9 }}
                                        >
                                            <div className="payment-method-details">
                                                <div className="payment-method-type">
                                                    <motion.span
                                                        className="payment-icon"
                                                        whileHover={{ rotate: 10, scale: 1.1 }}
                                                    >
                                                        {method.type === 'UPI' ? '₹' :
                                                            method.type === 'Bank Account' ? '🏦' : '📱'}
                                                    </motion.span>
                                                    <span className="payment-name">{method.type}</span>
                                                    {method.isDefault && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            transition={{
                                                                type: "spring",
                                                                stiffness: 260,
                                                                damping: 20
                                                            }}
                                                        >
                                                            <Badge variant="success">Default</Badge>
                                                        </motion.div>
                                                    )}
                                                </div>
                                                <div className="payment-method-info">
                                                    <span>{method.details}</span>
                                                </div>
                                            </div>
                                            {isEditing && (
                                                <div className="payment-method-actions">
                                                    {!method.isDefault && (
                                                        <motion.button
                                                            className="action-btn set-default"
                                                            onClick={() => handleSetDefaultPaymentMethod(method.id)}
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                        >
                                                            Set as Default
                                                        </motion.button>
                                                    )}
                                                    <motion.button
                                                        className="action-btn remove"
                                                        onClick={() => handleRemovePaymentMethod(method.id)}
                                                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(229, 57, 53, 0.1)' }}
                                                        whileTap={{ scale: 0.95 }}
                                                    >
                                                        Remove
                                                    </motion.button>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        </Card>
                    </motion.div>
                );

            case 'security':
                return (
                    <motion.div
                        key="security"
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={sectionVariants}
                    >
                        <Card className={`account-section ${activeSection === 'security' ? 'section-active' : ''}`}>
                            <motion.h2
                                className="section-title"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                Security Settings
                            </motion.h2>

                            <div className="security-container">
                                <div className="security-item">
                                    <div className="security-info">
                                        <h3>Password</h3>
                                        <p>Last changed: {formatDate(securitySettings.passwordLastChanged)}</p>
                                    </div>
                                    <Button variant="outlined" size="small">
                                        Change Password
                                    </Button>
                                </div>

                                <div className="security-item">
                                    <div className="security-info">
                                        <h3>Two-Factor Authentication</h3>
                                        <p>Adds an extra layer of security to your account</p>
                                    </div>
                                    <div className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            id="twoFactorAuth"
                                            checked={securitySettings.twoFactorAuth}
                                            onChange={() => setSecuritySettings({
                                                ...securitySettings,
                                                twoFactorAuth: !securitySettings.twoFactorAuth
                                            })}
                                            disabled={!isEditing}
                                        />
                                        <label htmlFor="twoFactorAuth" className="toggle-label"></label>
                                    </div>
                                </div>

                                <div className="security-item">
                                    <div className="security-info">
                                        <h3>Login Notifications</h3>
                                        <p>Get notified when someone logs into your account</p>
                                    </div>
                                    <div className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            id="loginNotifications"
                                            checked={securitySettings.loginNotifications}
                                            onChange={() => setSecuritySettings({
                                                ...securitySettings,
                                                loginNotifications: !securitySettings.loginNotifications
                                            })}
                                            disabled={!isEditing}
                                        />
                                        <label htmlFor="loginNotifications" className="toggle-label"></label>
                                    </div>
                                </div>

                                <div className="security-item">
                                    <div className="security-info">
                                        <h3>Active Sessions</h3>
                                        <p>Manage devices where you're currently logged in</p>
                                    </div>
                                    <Button variant="outlined" size="small">
                                        View Sessions
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                );

            case 'support':
                return (
                    <motion.div
                        key="support"
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={sectionVariants}
                    >
                        <Card className={`account-section ${activeSection === 'support' ? 'section-active' : ''}`}>
                            <motion.h2
                                className="section-title"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                Help & Support
                            </motion.h2>

                            <motion.div
                                className="support-container"
                                variants={{
                                    animate: {
                                        transition: {
                                            staggerChildren: 0.1,
                                            delayChildren: 0.2
                                        }
                                    }
                                }}
                            >
                                {[
                                    { icon: '📘', title: 'Knowledge Base', description: 'Browse our articles to learn more about using CentiVerse', action: 'View Articles' },
                                    { icon: '🎯', title: 'Feature Requests', description: 'Suggest new features or improvements to our platform', action: 'Submit Request' },
                                    { icon: '🐞', title: 'Report a Bug', description: 'Let us know if something isn\'t working as expected', action: 'Report Bug' },
                                    { icon: '📞', title: 'Contact Support', description: 'Get in touch with our customer support team', action: 'Contact Us' }
                                ].map((card, index) => (
                                    <motion.div
                                        className="support-card"
                                        key={card.title}
                                        variants={itemVariants}
                                        custom={index}
                                        whileHover={{
                                            y: -10,
                                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                                        }}
                                    >
                                        <motion.div
                                            className="support-icon"
                                            animate={{
                                                rotate: [0, 10, 0, -10, 0],
                                            }}
                                            transition={{
                                                repeat: Infinity,
                                                duration: 5,
                                                repeatDelay: 2
                                            }}
                                        >
                                            {card.icon}
                                        </motion.div>
                                        <h3>{card.title}</h3>
                                        <p>{card.description}</p>
                                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                            <Button variant="outlined">{card.action}</Button>
                                        </motion.div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </Card>
                    </motion.div>
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