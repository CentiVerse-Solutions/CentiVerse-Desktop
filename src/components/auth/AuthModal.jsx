import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './AuthModal.css';

const ModernAuthModal = ({ isOpen, onClose, initialMode = 'login', onSuccessfulAuth }) => {
    const [mode, setMode] = useState(initialMode);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        confirmPassword: '',
        upiId: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [animateForm, setAnimateForm] = useState(false);
    const modalRef = useRef(null);
    const contentRef = useRef(null);
    const formRef = useRef(null);

    useEffect(() => {
        setMode(initialMode);
    }, [initialMode]);

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setFormData({
                email: '',
                password: '',
                name: '',
                confirmPassword: '',
                upiId: ''
            });
            setErrors({});
            setLoading(false);
            setShowPassword(false);
        } else {
            // Animation when modal opens
            document.body.style.overflow = 'hidden';
            setTimeout(() => {
                if (contentRef.current) {
                    contentRef.current.classList.add('modal-content-visible');
                }
            }, 100);
        }

        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(prev => !prev);
    };

    const validate = () => {
        const newErrors = {};

        // Email validation
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email address is invalid';
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        // Additional validations for signup
        if (mode === 'signup') {
            if (!formData.name) {
                newErrors.name = 'Name is required';
            }

            if (!formData.confirmPassword) {
                newErrors.confirmPassword = 'Please confirm your password';
            } else if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Passwords do not match';
            }

            // UPI ID validation - optional but if provided, validate format
            if (formData.upiId && !/^[a-zA-Z0-9.-]{2,256}@[a-zA-Z][a-zA-Z]{2,64}$/.test(formData.upiId)) {
                newErrors.upiId = 'Please enter a valid UPI ID (e.g., name@upi)';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) {
            // Shake form on validation failure
            if (formRef.current) {
                formRef.current.classList.add('shake-animation');
                setTimeout(() => {
                    formRef.current.classList.remove('shake-animation');
                }, 500);
            }
            return;
        }

        setLoading(true);

        try {
            // This is where you would integrate with your backend
            // For now, we'll simulate a successful authentication
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Success animation
            setAnimateForm(true);
            setTimeout(() => {
                // Call the success callback
                onSuccessfulAuth();
                handleClose();
            }, 800);
        } catch (error) {
            setErrors({
                form: 'Authentication failed. Please try again.'
            });
            setLoading(false);
        }
    };

    const handleModalClick = (e) => {
        if (modalRef.current && !contentRef.current.contains(e.target)) {
            handleClose();
        }
    };

    const handleClose = () => {
        if (contentRef.current) {
            contentRef.current.classList.remove('modal-content-visible');
            contentRef.current.classList.add('modal-content-exit');
            setTimeout(() => {
                onClose();
            }, 300);
        } else {
            onClose();
        }
    };

    const switchMode = (newMode) => {
        if (mode === newMode) return;

        // Add transition animation
        if (formRef.current) {
            formRef.current.classList.add('form-exit');
            setTimeout(() => {
                setMode(newMode);
                formRef.current.classList.remove('form-exit');
                formRef.current.classList.add('form-enter');
                setTimeout(() => {
                    formRef.current.classList.remove('form-enter');
                }, 500);
            }, 300);
        } else {
            setMode(newMode);
        }
    };

    // If the modal is not open, don't render anything
    if (!isOpen) return null;

    // Animation variants for Framer Motion
    const overlayVariants = {
        hidden: { opacity: 0, backdropFilter: "blur(0px)" },
        visible: {
            opacity: 1,
            backdropFilter: "blur(8px)",
            transition: { duration: 0.4, ease: "easeInOut" }
        },
        exit: {
            opacity: 0,
            backdropFilter: "blur(0px)",
            transition: { duration: 0.3, ease: "easeInOut" }
        }
    };

    const modalVariants = {
        hidden: { opacity: 0, y: 40, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration: 0.5,
                ease: [0.34, 1.56, 0.64, 1],
                delay: 0.1
            }
        },
        exit: {
            opacity: 0,
            y: 40,
            scale: 0.95,
            transition: {
                duration: 0.3,
                ease: [0.36, 0, 0.66, -0.56]
            }
        },
        success: {
            scale: 1.05,
            boxShadow: "0 0 80px rgba(105, 162, 151, 0.8)",
            transition: { duration: 0.3, ease: "easeInOut" }
        }
    };

    const formSuccessVariants = {
        initial: { opacity: 1 },
        success: {
            opacity: 0,
            y: -20,
            transition: { duration: 0.3, ease: "easeOut" }
        }
    };

    const successVariants = {
        initial: { opacity: 0, scale: 0.8, y: 30 },
        animate: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { duration: 0.5, ease: "easeOut", delay: 0.2 }
        }
    };

    const inputVariants = {
        focus: { scale: 1.02, transition: { duration: 0.2 } },
        blur: { scale: 1, transition: { duration: 0.2 } }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="modern-auth-overlay"
                    onClick={handleModalClick}
                    ref={modalRef}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={overlayVariants}
                >
                    <motion.div
                        className="modern-auth-modal"
                        ref={contentRef}
                        variants={modalVariants}
                        animate={animateForm ? "success" : "visible"}
                    >
                        <motion.button
                            className="modern-close-button"
                            onClick={handleClose}
                            aria-label="Close"
                            whileHover={{ scale: 1.1, rotate: 90, backgroundColor: 'var(--teal-light)', color: 'white' }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </motion.button>

                        <motion.div
                            className="modern-auth-header"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                        >
                            <motion.div
                                className="logo-container"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.3, duration: 0.5, type: "spring", stiffness: 200 }}
                            >
                                <motion.div
                                    className="logo-circle"
                                    animate={{
                                        y: [0, -10, 0],
                                    }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 6,
                                        ease: "easeInOut"
                                    }}
                                >
                                    <span>CV</span>
                                </motion.div>
                            </motion.div>
                            <motion.h2
                                className="modern-auth-title"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.5 }}
                            >
                                {mode === 'login' ? 'Welcome Back' : 'Join CentiVerse'}
                            </motion.h2>
                            <motion.p
                                className="modern-auth-subtitle"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5, duration: 0.5 }}
                            >
                                {mode === 'login'
                                    ? 'Sign in to continue your journey'
                                    : 'Create an account to start managing expenses'}
                            </motion.p>
                        </motion.div>

                        <motion.div
                            className="modern-auth-tabs"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6, duration: 0.5 }}
                        >
                            <motion.button
                                className={`modern-auth-tab ${mode === 'login' ? 'active' : ''}`}
                                onClick={() => switchMode('login')}
                                whileHover={{ y: -2 }}
                                whileTap={{ y: 0 }}
                            >
                                Log In
                            </motion.button>
                            <motion.button
                                className={`modern-auth-tab ${mode === 'signup' ? 'active' : ''}`}
                                onClick={() => switchMode('signup')}
                                whileHover={{ y: -2 }}
                                whileTap={{ y: 0 }}
                            >
                                Sign Up
                            </motion.button>
                            <motion.div
                                className="modern-tab-indicator"
                                initial={false}
                                animate={{
                                    left: mode === 'login' ? '0%' : '50%',
                                }}
                                transition={{ duration: 0.5, type: "spring", stiffness: 300, damping: 30 }}
                                style={{ width: '50%' }}
                            ></motion.div>
                        </motion.div>

                        <AnimatePresence mode="wait">
                            <motion.form
                                key={mode}
                                onSubmit={handleSubmit}
                                className="modern-auth-form"
                                ref={formRef}
                                variants={formSuccessVariants}
                                initial="initial"
                                animate={animateForm ? "success" : "initial"}
                                exit={{ opacity: 0, x: mode === 'login' ? -30 : 30 }}
                                transition={{ duration: 0.3 }}
                            >
                                {mode === 'signup' && (
                                    <motion.div
                                        className="modern-form-group"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <label htmlFor="name">Full Name</label>
                                        <motion.div
                                            className="modern-input-container"
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                        >
                                            <svg className="modern-input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            <motion.input
                                                type="text"
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                placeholder="Enter your name"
                                                className={errors.name ? 'error' : ''}
                                                variants={inputVariants}
                                                whileFocus="focus"
                                                whileBlur="blur"
                                            />
                                            <div className="input-highlight"></div>
                                        </motion.div>
                                        {errors.name && <span className="modern-error-message">{errors.name}</span>}
                                    </motion.div>
                                )}

                                <motion.div
                                    className="modern-form-group"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: mode === 'signup' ? 0.1 : 0 }}
                                >
                                    <label htmlFor="email">Email Address</label>
                                    <motion.div
                                        className="modern-input-container"
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                    >
                                        <svg className="modern-input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <motion.input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="Enter your email"
                                            className={errors.email ? 'error' : ''}
                                            variants={inputVariants}
                                            whileFocus="focus"
                                            whileBlur="blur"
                                        />
                                        <div className="input-highlight"></div>
                                    </motion.div>
                                    {errors.email && <span className="modern-error-message">{errors.email}</span>}
                                </motion.div>

                                <motion.div
                                    className="modern-form-group"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: mode === 'signup' ? 0.2 : 0.1 }}
                                >
                                    <label htmlFor="password">Password</label>
                                    <motion.div
                                        className="modern-input-container"
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                    >
                                        <svg className="modern-input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M19 11H5V21H19V11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M17 7V8C17 9.65685 15.6569 11 14 11H10C8.34315 11 7 9.65685 7 8V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M12 15V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <motion.input
                                            type={showPassword ? "text" : "password"}
                                            id="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="Enter your password"
                                            className={errors.password ? 'error' : ''}
                                            variants={inputVariants}
                                            whileFocus="focus"
                                            whileBlur="blur"
                                        />
                                        <motion.button
                                            type="button"
                                            className="password-toggle"
                                            onClick={togglePasswordVisibility}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            {showPassword ? (
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M14.12 14.12C13.8454 14.4148 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1752 15.0074 10.8016 14.8565C10.4281 14.7056 10.0887 14.4811 9.80385 14.1962C9.51897 13.9113 9.29439 13.572 9.14351 13.1984C8.99262 12.8249 8.91853 12.4247 8.92563 12.0219C8.93274 11.6191 9.02091 11.2219 9.18488 10.8539C9.34884 10.4859 9.58525 10.1547 9.88 9.88001M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68192 3.96914 7.65663 6.06 6.06001L17.94 17.94ZM9.9 4.24002C10.5883 4.0789 11.2931 3.99836 12 4.00002C19 4.00002 23 12 23 12C22.393 13.1356 21.6691 14.2048 20.84 15.19L9.9 4.24002Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M1 1L23 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            ) : (
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </motion.button>
                                        <div className="input-highlight"></div>
                                    </motion.div>
                                    {errors.password && <span className="modern-error-message">{errors.password}</span>}
                                </motion.div>

                                {mode === 'signup' && (
                                    <>
                                        <motion.div
                                            className="modern-form-group"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5, delay: 0.3 }}
                                        >
                                            <label htmlFor="confirmPassword">Confirm Password</label>
                                            <motion.div
                                                className="modern-input-container"
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.99 }}
                                            >
                                                <svg className="modern-input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M19 11H5V21H19V11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M17 7V8C17 9.65685 15.6569 11 14 11H10C8.34315 11 7 9.65685 7 8V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M12 15V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                <motion.input
                                                    type={showPassword ? "text" : "password"}
                                                    id="confirmPassword"
                                                    name="confirmPassword"
                                                    value={formData.confirmPassword}
                                                    onChange={handleChange}
                                                    placeholder="Confirm your password"
                                                    className={errors.confirmPassword ? 'error' : ''}
                                                    variants={inputVariants}
                                                    whileFocus="focus"
                                                    whileBlur="blur"
                                                />
                                                <div className="input-highlight"></div>
                                            </motion.div>
                                            {errors.confirmPassword && (
                                                <span className="modern-error-message">{errors.confirmPassword}</span>
                                            )}
                                        </motion.div>

                                        <motion.div
                                            className="modern-form-group"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5, delay: 0.4 }}
                                        >
                                            <label htmlFor="upiId">UPI ID <span className="optional-label">(Optional)</span></label>
                                            <motion.div
                                                className="modern-input-container"
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.99 }}
                                            >
                                                <svg className="modern-input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M21 4H3C1.89543 4 1 4.89543 1 6V18C1 19.1046 1.89543 20 3 20H21C22.1046 20 23 19.1046 23 18V6C23 4.89543 22.1046 4 21 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M1 10H23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                <motion.input
                                                    type="text"
                                                    id="upiId"
                                                    name="upiId"
                                                    value={formData.upiId}
                                                    onChange={handleChange}
                                                    placeholder="yourname@upi"
                                                    className={errors.upiId ? 'error' : ''}
                                                    variants={inputVariants}
                                                    whileFocus="focus"
                                                    whileBlur="blur"
                                                />
                                                <div className="input-highlight"></div>
                                            </motion.div>
                                            {errors.upiId && <span className="modern-error-message">{errors.upiId}</span>}
                                        </motion.div>
                                    </>
                                )}

                                {errors.form && <div className="modern-form-error">{errors.form}</div>}

                                <motion.button
                                    type="submit"
                                    className={`modern-auth-button ${loading ? 'loading' : ''}`}
                                    disabled={loading}
                                    whileHover={{ y: -5, boxShadow: "0 8px 16px rgba(0,0,0,0.2)" }}
                                    whileTap={{ y: -2, boxShadow: "0 4px 8px rgba(0,0,0,0.2)" }}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        duration: 0.5,
                                        delay: mode === 'signup' ? 0.5 : 0.2
                                    }}
                                >
                                    <span className="button-text">{mode === 'login' ? 'Log In' : 'Sign Up'}</span>
                                    <span className="button-loader">
                                        <svg className="spinner" viewBox="0 0 50 50">
                                            <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                                        </svg>
                                    </span>
                                </motion.button>
                            </motion.form>
                        </AnimatePresence>

                        {/* Success Animation */}
                        {animateForm && (
                            <motion.div
                                className="success-animation"
                                variants={successVariants}
                                initial="initial"
                                animate="animate"
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 50
                                }}
                            >
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{
                                        scale: [0, 1.2, 1],
                                        opacity: 1
                                    }}
                                    transition={{
                                        duration: 0.6,
                                        times: [0, 0.6, 1]
                                    }}
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '50%',
                                        backgroundColor: 'var(--teal)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: '1rem'
                                    }}
                                >
                                    <motion.svg
                                        width="40"
                                        height="40"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: 1 }}
                                        transition={{ duration: 0.6, delay: 0.3 }}
                                    >
                                        <motion.path
                                            d="M20 6L9 17L4 12"
                                            stroke="white"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{ duration: 0.6, delay: 0.3 }}
                                        />
                                    </motion.svg>
                                </motion.div>
                                <motion.h3
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    style={{
                                        color: 'var(--teal-dark)',
                                        fontSize: '1.5rem',
                                        fontWeight: 600,
                                        margin: 0
                                    }}
                                >
                                    {mode === 'login' ? 'Welcome Back!' : 'Account Created!'}
                                </motion.h3>
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    style={{
                                        color: 'var(--text-medium)',
                                        textAlign: 'center',
                                        margin: '0.5rem 0 0'
                                    }}
                                >
                                    Redirecting you to dashboard...
                                </motion.p>
                            </motion.div>
                        )}

                        {mode === 'login' && !animateForm && (
                            <motion.div
                                className="modern-auth-footer"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.5 }}
                            >
                                <motion.a
                                    href="#forgot-password"
                                    className="modern-forgot-password"
                                    whileHover={{
                                        color: 'var(--teal-dark)',
                                        scale: 1.05
                                    }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Forgot your password?
                                </motion.a>
                            </motion.div>
                        )}

                        {!animateForm && (
                            <motion.div
                                className="modern-social-auth"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.5 }}
                            >
                                <p className="modern-or-divider">
                                    <span>Or continue with</span>
                                </p>
                                <div className="modern-social-buttons">
                                    <motion.button
                                        className="modern-social-button google"
                                        whileHover={{
                                            y: -5,
                                            boxShadow: "0 8px 15px rgba(0,0,0,0.1)",
                                            borderColor: "var(--teal-light)"
                                        }}
                                        whileTap={{ y: -2 }}
                                    >
                                        <motion.svg
                                            viewBox="0 0 24 24"
                                            width="24"
                                            height="24"
                                            whileHover={{ rotate: 5, scale: 1.1 }}
                                        >
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </motion.svg>
                                        <span>Google</span>
                                    </motion.button>
                                    <motion.button
                                        className="modern-social-button facebook"
                                        whileHover={{
                                            y: -5,
                                            boxShadow: "0 8px 15px rgba(0,0,0,0.1)",
                                            borderColor: "var(--teal-light)"
                                        }}
                                        whileTap={{ y: -2 }}
                                    >
                                        <motion.svg
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            whileHover={{ rotate: 5, scale: 1.1 }}
                                        >
                                            <path d="M22.56 12.25C22.56 6.82 18.15 2.42 12.75 2.42C7.34 2.42 2.94 6.83 2.94 12.25C2.94 17.16 6.45 21.22 11.04 22V15.03H8.58V12.25H11.05V10.12C11.05 7.73 12.47 6.42 14.66 6.42C15.71 6.42 16.81 6.59 16.81 6.59V8.95H15.59C14.39 8.95 14.02 9.73 14.02 10.52V12.25H16.69L16.27 15.03H14.01V22C18.6 21.22 22.56 17.16 22.56 12.25Z" fill="#1877F2" />
                                        </motion.svg>
                                        <span>Facebook</span>
                                    </motion.button>
                                    <motion.button
                                        className="modern-social-button apple"
                                        whileHover={{
                                            y: -5,
                                            boxShadow: "0 8px 15px rgba(0,0,0,0.1)",
                                            borderColor: "var(--teal-light)"
                                        }}
                                        whileTap={{ y: -2 }}
                                    >
                                        <motion.svg
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            whileHover={{ rotate: 5, scale: 1.1 }}
                                        >
                                            <path d="M16.95 4.17C16.1535 4.17 15.379 4.53311 14.7545 5.182C14.1301 5.83089 13.65 6.79178 13.529 7.926C13.529 7.926 13.5095 8.07267 13.5095 8.15C13.5095 8.227 13.529 8.37333 13.529 8.374C13.571 8.374 13.7253 8.396 13.856 8.396C14.611 8.396 15.3555 8.05467 15.9415 7.464C16.5275 6.87333 16.97 5.98867 16.97 4.94C16.97 4.94 16.9895 4.786 16.9895 4.712C16.9895 4.638 16.97 4.484 16.97 4.484C16.97 4.484 16.9675 4.36856 16.9579 4.23C16.9568 4.21023 16.9556 4.19003 16.9544 4.17H16.95ZM19.895 15.444C19.831 15.59 19.766 15.736 19.696 15.882C19.487 16.285 19.246 16.6553 18.975 16.997C18.7943 17.234 18.644 17.423 18.5243 17.564C18.3388 17.7826 18.1186 17.968 17.873 18.11C17.513 18.326 17.13 18.4513 16.724 18.486C16.4235 18.5135 16.1213 18.4666 15.8407 18.349C15.5601 18.2313 15.3086 18.0459 15.106 17.806C14.7815 17.4274 14.4099 17.1032 14 16.843C13.5735 16.5758 13.0926 16.4259 12.599 16.405C12.1217 16.4071 11.6513 16.5217 11.226 16.741C10.9754 16.8765 10.752 17.059 10.5685 17.279C10.385 17.499 10.2445 17.7539 10.156 18.03C10.0591 18.329 9.9148 18.612 9.729 18.868C9.5373 19.142 9.299 19.3791 9.025 19.569C8.60614 19.8482 8.1213 20.0123 7.621 20.044C7.117 20.077 6.635 19.9606 6.173 19.6949C5.711 19.4293 5.33967 19.0598 5.032 18.602C4.73804 18.1617 4.48931 17.6939 4.287 17.204C3.827 16.019 3.553 14.7634 3.476 13.486C3.35291 11.8422 3.61504 10.1952 4.244 8.678C4.7065 7.5505 5.37993 6.53271 6.219 5.684C7.122 4.784 8.19033 4.114 9.422 3.674C10.43 3.3 11.4995 3.16633 12.599 3.278C13.3343 3.33733 14.0587 3.47567 14.773 3.684C15.4963 3.89633 16.198 4.18767 16.879 4.56C17.3568 4.81599 17.8757 4.98956 18.412 5.074C18.9493 5.16933 19.517 5.156 20.116 5.034C21.0903 4.85 21.998 4.39933 22.839 3.684L21.125 6.28C20.5503 6.87533 19.901 7.31667 19.177 7.598C18.8155 7.734 18.4375 7.82533 18.045 7.872C17.6525 7.91867 17.2673 7.90967 16.889 7.844C16.613 7.79133 16.3453 7.71467 16.086 7.614C15.8267 7.51333 15.5693 7.402 15.315 7.28C14.8073 7.03667 14.289 6.84833 13.76 6.714C13.2293 6.576 12.688 6.50467 12.136 6.5C11.6307 6.495 11.1267 6.56067 10.624 6.694C10.117 6.82867 9.63667 7.014 9.183 7.254C8.42767 7.66733 7.81433 8.246 7.343 8.99C6.88033 9.71733 6.6 10.6133 6.5 11.678C6.44978 12.2296 6.49902 12.7845 6.64533 13.3157C6.79165 13.8469 7.03249 14.345 7.35395 14.7843C7.67541 15.2235 8.07204 15.5959 8.52371 15.8799C8.97538 16.1639 9.47283 16.3542 9.99 16.439C10.4333 16.5237 10.8547 16.4437 11.254 16.199C11.6533 15.9543 11.9347 15.6003 12.098 15.137C12.2833 14.6083 12.5523 14.107 12.905 13.633C13.2577 13.159 13.7033 12.772 14.242 12.474C14.9687 12.0607 15.7927 11.8407 16.631 11.834C17.4177 11.8253 18.1967 11.99 18.926 12.322C19.3587 12.5093 19.7523 12.777 20.107 13.125C20.4617 13.473 20.7603 13.903 21.003 14.416C21.0483 14.5063 21.0873 14.599 21.12 14.694C21.155 14.793 21.1813 14.8913 21.199 14.989C20.773 15.1376 20.3378 15.2654 19.895 15.372V15.444Z" fill="black" />
                                        </motion.svg>
                                        <span>Apple</span>
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}

                        {/* Animated background elements */}
                        <div className="animated-background">
                            <motion.div
                                className="bg-circle circle-1"
                                animate={{
                                    x: [0, 30, 0],
                                    y: [0, 20, 0],
                                    rotate: [0, 8, -5, 0]
                                }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 15,
                                    ease: "easeInOut"
                                }}
                            ></motion.div>
                            <motion.div
                                className="bg-circle circle-2"
                                animate={{
                                    x: [0, -20, 0],
                                    y: [0, 10, 0],
                                    rotate: [0, -5, 8, 0]
                                }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 20,
                                    ease: "easeInOut"
                                }}
                            ></motion.div>
                            <motion.div
                                className="bg-circle circle-3"
                                animate={{
                                    x: [0, 15, -15, 0],
                                    y: [0, -10, 5, 0],
                                    rotate: [0, 5, -8, 0]
                                }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 12,
                                    ease: "easeInOut"
                                }}
                            ></motion.div>
                            <motion.div
                                className="bg-blur blur-1"
                                animate={{
                                    x: [0, 30, 0],
                                    y: [0, -20, 0],
                                    scale: [1, 1.1, 1]
                                }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 15,
                                    ease: "easeInOut"
                                }}
                            ></motion.div>
                            <motion.div
                                className="bg-blur blur-2"
                                animate={{
                                    x: [0, -25, 0],
                                    y: [0, 15, 0],
                                    scale: [1, 1.2, 1]
                                }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 20,
                                    ease: "easeInOut",
                                    delay: 2
                                }}
                            ></motion.div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ModernAuthModal;