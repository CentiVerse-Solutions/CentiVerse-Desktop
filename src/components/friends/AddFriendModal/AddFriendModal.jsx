import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Phone, CheckCircle } from 'lucide-react';
import './AddFriendModal.css';

const AddFriendModal = ({ isOpen, onClose, onAddFriend }) => {
    const [activeTab, setActiveTab] = useState('email');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Close modal with escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        // Basic validation
        if (activeTab === 'email' && (!name || !email)) {
            setError('Please provide both name and email');
            return;
        }

        if (activeTab === 'phone' && (!name || !phone)) {
            setError('Please provide both name and phone');
            return;
        }

        // Generate a new ID (in a real app, this would come from your backend)
        const newId = `user-${Date.now()}`;

        // Create a new friend object
        const newFriend = {
            id: newId,
            name,
            email: activeTab === 'email' ? email : '',
            phone: activeTab === 'phone' ? phone : '',
            avatar: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 100)}.jpg`,
            balance: 0,
            lastActivity: new Date().toISOString(),
        };

        // Show success message briefly before closing
        setSuccessMessage(`${name} has been added to your friends!`);

        setTimeout(() => {
            // Add the friend
            onAddFriend(newFriend);

            // Reset form
            setName('');
            setEmail('');
            setPhone('');
            setSuccessMessage('');
        }, 1500);
    };

    // Animation variants
    const overlayVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { duration: 0.3 }
        },
        exit: {
            opacity: 0,
            transition: { duration: 0.3 }
        }
    };

    const modalVariants = {
        hidden: {
            opacity: 0,
            y: 50,
            scale: 0.9
        },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 30,
                delay: 0.1
            }
        },
        exit: {
            opacity: 0,
            y: -30,
            scale: 0.9,
            transition: { duration: 0.2 }
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fr-modal-overlay"
                onClick={onClose}
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
            >
                <motion.div
                    className="fr-add-friend-modal"
                    onClick={e => e.stopPropagation()}
                    variants={modalVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    <AnimatePresence>
                        {successMessage ? (
                            <motion.div
                                className="fr-success-message"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            >
                                <motion.div
                                    className="fr-success-icon"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
                                >
                                    <CheckCircle size={48} />
                                </motion.div>
                                <h3>{successMessage}</h3>
                            </motion.div>
                        ) : (
                            <>
                                <div className="fr-modal-header">
                                    <h2 className="fr-modal-title">Add a Friend</h2>
                                    <motion.button
                                        className="fr-close-btn"
                                        onClick={onClose}
                                        whileHover={{ backgroundColor: "rgba(0,0,0,0.05)", scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <X size={20} />
                                    </motion.button>
                                </div>

                                <div className="fr-add-friend-tabs">
                                    {['email', 'phone'].map((tab) => {
                                        const Icon = tab === 'email' ? Mail : Phone;
                                        return (
                                            <motion.button
                                                key={tab}
                                                className={`fr-tab-btn ${activeTab === tab ? 'active' : ''}`}
                                                onClick={() => setActiveTab(tab)}
                                                whileHover={{ backgroundColor: "rgba(0,0,0,0.03)" }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                <Icon size={16} />
                                                <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                                                {activeTab === tab && (
                                                    <motion.div
                                                        className="fr-active-tab-indicator"
                                                        layoutId="activeTabIndicator"
                                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                    />
                                                )}
                                            </motion.button>
                                        );
                                    })}
                                </div>

                                <div className="fr-add-friend-content">
                                    <AnimatePresence mode="wait">
                                        {activeTab === 'email' && (
                                            <motion.form
                                                key="email"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                onSubmit={handleSubmit}
                                                className="fr-email-tab"
                                            >
                                                <div className="fr-form-group">
                                                    <label htmlFor="name">Name</label>
                                                    <input
                                                        id="name"
                                                        type="text"
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                        placeholder="Friend's name"
                                                        required
                                                    />
                                                </div>

                                                <div className="fr-form-group">
                                                    <label htmlFor="email">Email</label>
                                                    <input
                                                        id="email"
                                                        type="email"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        placeholder="friend@example.com"
                                                        required
                                                    />
                                                </div>

                                                {error && (
                                                    <motion.p
                                                        className="fr-error-message"
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                    >
                                                        {error}
                                                    </motion.p>
                                                )}

                                                <div className="fr-modal-footer">
                                                    <motion.button
                                                        type="button"
                                                        className="fr-cancel-btn"
                                                        onClick={onClose}
                                                        whileHover={{ backgroundColor: "rgba(0,0,0,0.05)", scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                    >
                                                        Cancel
                                                    </motion.button>
                                                    <motion.button
                                                        type="submit"
                                                        className="fr-submit-btn"
                                                        whileHover={{
                                                            backgroundColor: "var(--teal-dark)",
                                                            scale: 1.02,
                                                            boxShadow: "0 5px 15px rgba(105, 162, 151, 0.3)"
                                                        }}
                                                        whileTap={{ scale: 0.98 }}
                                                    >
                                                        Add Friend
                                                    </motion.button>
                                                </div>
                                            </motion.form>
                                        )}

                                        {activeTab === 'phone' && (
                                            <motion.form
                                                key="phone"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                onSubmit={handleSubmit}
                                                className="fr-phone-tab"
                                            >
                                                <div className="fr-form-group">
                                                    <label htmlFor="name-phone">Name</label>
                                                    <input
                                                        id="name-phone"
                                                        type="text"
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                        placeholder="Friend's name"
                                                        required
                                                    />
                                                </div>

                                                <div className="fr-form-group">
                                                    <label htmlFor="phone">Phone Number</label>
                                                    <input
                                                        id="phone"
                                                        type="tel"
                                                        value={phone}
                                                        onChange={(e) => setPhone(e.target.value)}
                                                        placeholder="(555) 123-4567"
                                                        required
                                                    />
                                                </div>

                                                {error && (
                                                    <motion.p
                                                        className="fr-error-message"
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                    >
                                                        {error}
                                                    </motion.p>
                                                )}

                                                <div className="fr-modal-footer">
                                                    <motion.button
                                                        type="button"
                                                        className="fr-cancel-btn"
                                                        onClick={onClose}
                                                        whileHover={{ backgroundColor: "rgba(0,0,0,0.05)", scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                    >
                                                        Cancel
                                                    </motion.button>
                                                    <motion.button
                                                        type="submit"
                                                        className="fr-submit-btn"
                                                        whileHover={{
                                                            backgroundColor: "var(--teal-dark)",
                                                            scale: 1.02,
                                                            boxShadow: "0 5px 15px rgba(105, 162, 151, 0.3)"
                                                        }}
                                                        whileTap={{ scale: 0.98 }}
                                                    >
                                                        Add Friend
                                                    </motion.button>
                                                </div>
                                            </motion.form>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </>
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AddFriendModal;