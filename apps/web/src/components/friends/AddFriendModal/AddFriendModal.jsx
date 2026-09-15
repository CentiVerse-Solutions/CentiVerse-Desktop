import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Phone, CheckCircle } from 'lucide-react';
import './AddFriendModal.css';
import AddFriendForm from '../../../features/friends/components/AddFriendForm';

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
                            <AddFriendForm
                                activeTab={activeTab}
                                email={email}
                                error={error}
                                handleSubmit={handleSubmit}
                                name={name}
                                onClose={onClose}
                                phone={phone}
                                setActiveTab={setActiveTab}
                                setEmail={setEmail}
                                setName={setName}
                                setPhone={setPhone}
                            />
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AddFriendModal;