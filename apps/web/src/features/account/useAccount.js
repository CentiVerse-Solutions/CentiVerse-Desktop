import React, { useState, useRef, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import { SUPPORTED_CURRENCIES as mockCurrencies } from '../../shared/currencies';

const defaultAvatar = 'https://via.placeholder.com/150';

/**
 * 7.4 -- Account's state and handlers, lifted verbatim out of the page so it is
 * left composing sections. Behaviour-preserving: the bodies are unchanged.
 */
export const useAccount = () => {
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

    return {
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
    };
};
