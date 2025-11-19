import React, { useState, useRef, useContext } from 'react';
import './Account.css';
import { AuthContext } from '../../context/AuthContext';
import {Avatar} from '../../components/common/Avatar/Avatar';
import {Button} from '../../components/common/Button/Button';
import {Card} from '../../components/common/Card/Card';
// Use a default import approach that's safer
// If you have the actual SVG file:
// import defaultAvatar from '../../assets/images/default-avatar.svg';
// Or use a placeholder for testing:
const defaultAvatar = 'https://via.placeholder.com/150';

const Account = () => {
    const { user, logout, updateUserProfile } = useContext(AuthContext);
    const fileInputRef = useRef(null);

    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState({
        name: user?.name || 'John Doe',
        email: user?.email || 'john.doe@example.com',
        phone: user?.phone || '+91 9876543210',
        upiId: user?.upiId || 'johndoe@upi',
        currency: user?.currency || 'INR',
        language: user?.language || 'English',
        darkMode: user?.darkMode || false,
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
        setProfileData({
            ...profileData,
            darkMode: !profileData.darkMode
        });
        // In a real app, you would also apply the dark mode to your app here
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
    };

    const handleSaveChanges = () => {
        // In a real app, you would call an API to update the user profile
        updateUserProfile({
            ...profileData,
            notifications
        });
        setIsEditing(false);
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

    return (
        <div className="account-page">
            <div className="account-header">
                <h1 className="account-title">My Account</h1>
                <Button
                    variant={isEditing ? "primary" : "outlined"}
                    onClick={handleEditToggle}
                >
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
            </div>

            <div className="account-content">
                <div className="account-sidebar">
                    <div className="profile-pic-container">
                        <div className="profile-pic" onClick={isEditing ? handleProfilePicClick : null}>
                            <Avatar
                                src={profileData.profilePic}
                                alt={profileData.name}
                                size="large"
                            />
                            {isEditing && (
                                <div className="edit-overlay">
                                    {/* Simplified icon */}
                                    <span className="icon">📷</span>
                                    <span>Change</span>
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                            accept="image/*"
                        />
                    </div>

                    <div className="user-info">
                        <h2 className="user-name">{profileData.name}</h2>
                        <p className="user-email">{profileData.email}</p>
                    </div>

                    <div className="account-menu">
                        <button className="menu-item active">
                            <span className="menu-icon">👤</span>
                            <span>Personal Info</span>
                        </button>
                        <button className="menu-item">
                            <span className="menu-icon">⚙️</span>
                            <span>Preferences</span>
                        </button>
                        <button className="menu-item">
                            <span className="menu-icon">🔔</span>
                            <span>Notifications</span>
                        </button>
                        <button className="menu-item">
                            <span className="menu-icon">💬</span>
                            <span>Support</span>
                        </button>
                        <button className="menu-item danger" onClick={handleLogout}>
                            <span className="menu-icon">🚪</span>
                            <span>Logout</span>
                        </button>
                    </div>
                </div>

                <div className="account-main">
                    <Card className="account-section">
                        <h2 className="section-title">Personal Information</h2>
                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="name">Full Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={profileData.name}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={profileData.email}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="phone">Phone Number</label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={profileData.phone}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="upiId">UPI ID</label>
                                <input
                                    type="text"
                                    id="upiId"
                                    name="upiId"
                                    value={profileData.upiId}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                />
                            </div>
                        </div>
                    </Card>

                    <Card className="account-section">
                        <h2 className="section-title">Preferences</h2>
                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="currency">Default Currency</label>
                                <select
                                    id="currency"
                                    name="currency"
                                    value={profileData.currency}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                >
                                    <option value="INR">Indian Rupee (₹)</option>
                                    <option value="USD">US Dollar ($)</option>
                                    <option value="EUR">Euro (€)</option>
                                    <option value="GBP">British Pound (£)</option>
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
                                >
                                    <option value="English">English</option>
                                    <option value="Hindi">Hindi</option>
                                    <option value="Spanish">Spanish</option>
                                    <option value="French">French</option>
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
                    </Card>

                    <Card className="account-section">
                        <h2 className="section-title">Email Notifications</h2>
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
                                    <label className="notification-label">Major CentiVerse news and updates</label>
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
                    </Card>

                    <Card className="account-section">
                        <h2 className="section-title">Account Actions</h2>
                        <div className="account-actions">
                            <div className="action-group">
                                <h3>Data Management</h3>
                                <Button variant="outlined" onClick={handleExportData}>
                                    <span className="button-icon">📤</span>
                                    <span>Export my data</span>
                                </Button>
                            </div>
                            <div className="action-group">
                                <h3>Danger Zone</h3>
                                <Button variant="danger" onClick={handleDeleteAccount}>
                                    <span className="button-icon">🗑️</span>
                                    <span>Delete my account</span>
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {isEditing && (
                        <div className="account-actions-footer">
                            <Button variant="primary" onClick={handleSaveChanges}>
                                Save Changes
                            </Button>
                            <Button variant="outlined" onClick={handleEditToggle}>
                                Cancel
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Account;