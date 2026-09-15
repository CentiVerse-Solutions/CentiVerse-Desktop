import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Image, Plus, Camera, Search, Check } from 'lucide-react';
import './NewGroupModal.css';
import GroupDetailsStep from '../../../features/groups/components/newGroup/GroupDetailsStep';
import GroupMembersStep from '../../../features/groups/components/newGroup/GroupMembersStep';

const NewGroupModal = ({ isOpen, onClose, onCreateGroup, friends = [] }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        currency: 'USD',
        members: []
    });
    const [errors, setErrors] = useState({});
    const [step, setStep] = useState(1);
    const [selectedAvatar, setSelectedAvatar] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredFriends, setFilteredFriends] = useState(friends);

    // Default avatars to choose from
    const defaultAvatars = [
        '/path/to/group-avatar-1.jpg',
        '/path/to/group-avatar-2.jpg',
        '/path/to/group-avatar-3.jpg',
        '/path/to/group-avatar-4.jpg',
        '/path/to/group-avatar-5.jpg',
        '/path/to/group-avatar-6.jpg',
    ];

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: '',
                description: '',
                currency: 'USD',
                members: []
            });
            setErrors({});
            setStep(1);
            setSelectedAvatar(defaultAvatars[0]);
            setSearchQuery('');
        }
    }, [isOpen]);

    // Filter friends based on search query
    useEffect(() => {
        if (searchQuery) {
            const filtered = friends.filter(friend =>
                friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                friend.email.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredFriends(filtered);
        } else {
            setFilteredFriends(friends);
        }
    }, [searchQuery, friends]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when field is edited
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    };

    const toggleMember = (friend) => {
        setFormData(prev => {
            const isMember = prev.members.some(m => m.id === friend.id);

            if (isMember) {
                return {
                    ...prev,
                    members: prev.members.filter(m => m.id !== friend.id)
                };
            } else {
                return {
                    ...prev,
                    members: [...prev.members, friend]
                };
            }
        });
    };

    const validateStep1 = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Group name is required';
        }

        if (!selectedAvatar) {
            newErrors.avatar = 'Please select an avatar';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = () => {
        const newErrors = {};

        if (formData.members.length === 0) {
            newErrors.members = 'Please select at least one member';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNextStep = () => {
        if (step === 1 && validateStep1()) {
            setStep(2);
        }
    };

    const handlePrevStep = () => {
        if (step === 2) {
            setStep(1);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (step === 2 && validateStep2()) {
            onCreateGroup({
                ...formData,
                avatar: selectedAvatar,
                createdAt: new Date().toISOString()
            });
            onClose();
        }
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
        hidden: { opacity: 0, scale: 0.9, y: 20 },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 30
            }
        },
        exit: {
            opacity: 0,
            scale: 0.9,
            y: 20,
            transition: { duration: 0.2 }
        }
    };

    const stepVariants = {
        hidden: { opacity: 0, x: 20 },
        visible: {
            opacity: 1,
            x: 0,
            transition: { duration: 0.3 }
        },
        exit: {
            opacity: 0,
            x: -20,
            transition: { duration: 0.2 }
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="modal-overlay"
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
            >
                <motion.div
                    className="modal-content new-group-modal"
                    variants={modalVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="new-group-title"
                >
                    <div className="modal-header">
                        <h2 id="new-group-title" className="modal-title">
                            <Users className="modal-title-icon" size={20} />
                            {step === 1 ? 'Create New Group' : 'Add Group Members'}
                        </h2>
                        <motion.button
                            className="modal-close-btn"
                            onClick={onClose}
                            whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.06)" }}
                            whileTap={{ scale: 0.92 }}
                        >
                            <X size={20} />
                        </motion.button>
                    </div>

                    <div className="modal-steps">
                        <div className={`modal-step ${step === 1 ? 'active' : ''}`}>
                            <div className="step-number">1</div>
                            <span className="step-name">Group Details</span>
                        </div>
                        <div className="step-connector"></div>
                        <div className={`modal-step ${step === 2 ? 'active' : ''}`}>
                            <div className="step-number">2</div>
                            <span className="step-name">Add Members</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="new-group-form">
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <GroupDetailsStep
                                    defaultAvatars={defaultAvatars}
                                    errors={errors}
                                    formData={formData}
                                    handleChange={handleChange}
                                    selectedAvatar={selectedAvatar}
                                    setSelectedAvatar={setSelectedAvatar}
                                    step={step}
                                    stepVariants={stepVariants}
                                />
                            )}

                            {step === 2 && (
                                <GroupMembersStep
                                    errors={errors}
                                    filteredFriends={filteredFriends}
                                    formData={formData}
                                    friends={friends}
                                    searchQuery={searchQuery}
                                    setSearchQuery={setSearchQuery}
                                    step={step}
                                    stepVariants={stepVariants}
                                    toggleMember={toggleMember}
                                />
                            )}
                        </AnimatePresence>

                        <div className="modal-footer">
                            {step === 1 ? (
                                <div className="footer-buttons">
                                    <motion.button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={onClose}
                                        whileHover={{ y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Cancel
                                    </motion.button>
                                    <motion.button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={handleNextStep}
                                        whileHover={{ y: -2, boxShadow: "0 5px 15px rgba(105, 162, 151, 0.3)" }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Next
                                    </motion.button>
                                </div>
                            ) : (
                                <div className="footer-buttons">
                                    <motion.button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={handlePrevStep}
                                        whileHover={{ y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Back
                                    </motion.button>
                                    <motion.button
                                        type="submit"
                                        className="btn btn-primary"
                                        whileHover={{ y: -2, boxShadow: "0 5px 15px rgba(105, 162, 151, 0.3)" }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Create Group
                                    </motion.button>
                                </div>
                            )}
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default NewGroupModal;