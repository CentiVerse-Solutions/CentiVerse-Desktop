import React, { useState, useEffect, useRef } from 'react';
import './AuthModal.css';

// Use React.memo to prevent unnecessary re-renders of the entire component
const ModernAuthModal = React.memo(({ isOpen, onClose, initialMode = 'login', onSuccessfulAuth }) => {
    // Modal state
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
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Refs
    const modalRef = useRef(null);
    const contentRef = useRef(null);
    const formRef = useRef(null);

    // Memoized handlers (created only once)
    const handleChange = React.useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    }, []); // No dependencies to prevent recreation

    const togglePasswordVisibility = React.useCallback((field) => {
        if (field === 'password') {
            setShowPassword(prev => !prev);
        } else if (field === 'confirmPassword') {
            setShowConfirmPassword(prev => !prev);
        }
    }, []); // No dependencies to prevent recreation

    const handleModalClick = React.useCallback((e) => {
        if (modalRef.current && contentRef.current && !contentRef.current.contains(e.target)) {
            onClose();
        }
    }, [onClose]);

    const handleClose = React.useCallback(() => {
        onClose();
    }, [onClose]);

    const switchMode = React.useCallback((newMode) => {
        if (mode === newMode) return;
        setMode(newMode);
    }, [mode]);

    const validate = React.useCallback(() => {
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
    }, [formData, mode]);

    const handleSubmit = React.useCallback((e) => {
        e.preventDefault();

        if (!validate()) {
            if (formRef.current) {
                formRef.current.classList.add('shake-animation');
                setTimeout(() => {
                    if (formRef.current) {
                        formRef.current.classList.remove('shake-animation');
                    }
                }, 500);
            }
            return;
        }

        setLoading(true);

        // Simulate authentication
        setTimeout(() => {
            onSuccessfulAuth();
            onClose();
        }, 1500);
    }, [validate, onSuccessfulAuth, onClose]);

    // Update mode when initialMode prop changes
    useEffect(() => {
        if (initialMode !== mode) {
            setMode(initialMode);
        }
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
            setShowConfirmPassword(false);
        } else {
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    // If the modal is not open, don't render anything
    if (!isOpen) return null;

    return (
        <div className="modern-auth-overlay" onClick={handleModalClick} ref={modalRef}>
            <div className="modern-auth-modal" ref={contentRef}>
                <button
                    type="button"
                    className="modern-close-button"
                    onClick={handleClose}
                    aria-label="Close"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                <div className="modern-auth-scrollable">
                    <div className="modern-auth-header">
                        <div className="logo-container">
                            <div className="logo-circle">
                                <span>CV</span>
                            </div>
                        </div>
                        <h2 className="modern-auth-title">{mode === 'login' ? 'Welcome Back' : 'Join CentiVerse'}</h2>
                        <p className="modern-auth-subtitle">
                            {mode === 'login'
                                ? 'Sign in to continue your journey'
                                : 'Create an account to start managing expenses'}
                        </p>
                    </div>

                    <div className="modern-auth-tabs">
                        <button
                            type="button"
                            className={`modern-auth-tab ${mode === 'login' ? 'active' : ''}`}
                            onClick={() => switchMode('login')}
                        >
                            Log In
                        </button>
                        <button
                            type="button"
                            className={`modern-auth-tab ${mode === 'signup' ? 'active' : ''}`}
                            onClick={() => switchMode('signup')}
                        >
                            Sign Up
                        </button>
                        <div
                            className="modern-tab-indicator"
                            style={{
                                left: mode === 'login' ? '0%' : '50%',
                                width: '50%'
                            }}
                        ></div>
                    </div>

                    <form onSubmit={handleSubmit} className="modern-auth-form" ref={formRef}>
                        {mode === 'signup' && (
                            <div className="modern-form-group">
                                <label htmlFor="name">Full Name</label>
                                <div className="modern-input-container">
                                    <svg className="modern-input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Enter your name"
                                        className={errors.name ? 'error' : ''}
                                    />
                                    <div className="input-highlight"></div>
                                </div>
                                {errors.name && <span className="modern-error-message">{errors.name}</span>}
                            </div>
                        )}

                        <div className="modern-form-group">
                            <label htmlFor="email">Email Address</label>
                            <div className="modern-input-container">
                                <svg className="modern-input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter your email"
                                    className={errors.email ? 'error' : ''}
                                />
                                <div className="input-highlight"></div>
                            </div>
                            {errors.email && <span className="modern-error-message">{errors.email}</span>}
                        </div>

                        <div className="modern-form-group">
                            <label htmlFor="password">Password</label>
                            <div className="modern-input-container">
                                <svg className="modern-input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M19 11H5V21H19V11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M17 7V8C17 9.65685 15.6569 11 14 11H10C8.34315 11 7 9.65685 7 8V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M12 15V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter your password"
                                    className={errors.password ? 'error' : ''}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => togglePasswordVisibility('password')}
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
                                </button>
                                <div className="input-highlight"></div>
                            </div>
                            {errors.password && <span className="modern-error-message">{errors.password}</span>}
                        </div>

                        {mode === 'signup' && (
                            <>
                                <div className="modern-form-group">
                                    <label htmlFor="confirmPassword">Confirm Password</label>
                                    <div className="modern-input-container">
                                        <svg className="modern-input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M19 11H5V21H19V11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M17 7V8C17 9.65685 15.6569 11 14 11H10C8.34315 11 7 9.65685 7 8V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M12 15V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            placeholder="Confirm your password"
                                            className={errors.confirmPassword ? 'error' : ''}
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() => togglePasswordVisibility('confirmPassword')}
                                        >
                                            {showConfirmPassword ? (
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
                                        </button>
                                        <div className="input-highlight"></div>
                                    </div>
                                    {errors.confirmPassword && (
                                        <span className="modern-error-message">{errors.confirmPassword}</span>
                                    )}
                                </div>

                                <div className="modern-form-group">
                                    <label htmlFor="upiId">UPI ID <span className="optional-label">(Optional)</span></label>
                                    <div className="modern-input-container">
                                        <svg className="modern-input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M21 4H3C1.89543 4 1 4.89543 1 6V18C1 19.1046 1.89543 20 3 20H21C22.1046 20 23 19.1046 23 18V6C23 4.89543 22.1046 4 21 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M1 10H23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <input
                                            type="text"
                                            id="upiId"
                                            name="upiId"
                                            value={formData.upiId}
                                            onChange={handleChange}
                                            placeholder="yourname@upi"
                                            className={errors.upiId ? 'error' : ''}
                                        />
                                        <div className="input-highlight"></div>
                                    </div>
                                    {errors.upiId && <span className="modern-error-message">{errors.upiId}</span>}
                                </div>
                            </>
                        )}

                        {errors.form && <div className="modern-form-error">{errors.form}</div>}

                        <button
                            type="submit"
                            className={`modern-auth-button ${loading ? 'loading' : ''}`}
                            disabled={loading}
                        >
                            <span className="button-text">{mode === 'login' ? 'Log In' : 'Sign Up'}</span>
                            {loading && (
                                <span className="button-loader">
                                    <svg className="spinner" viewBox="0 0 50 50">
                                        <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                                    </svg>
                                </span>
                            )}
                        </button>
                    </form>

                    {mode === 'login' && (
                        <div className="modern-auth-footer">
                            <a href="#forgot-password" className="modern-forgot-password">
                                Forgot your password?
                            </a>
                        </div>
                    )}

                    <div className="modern-social-auth">
                        <p className="modern-or-divider">
                            <span>Or continue with</span>
                        </p>
                        <div className="modern-social-buttons">
                            <button type="button" className="modern-social-button google">
                                <svg viewBox="0 0 24 24" width="24" height="24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                <span>Google</span>
                            </button>
                            <button type="button" className="modern-social-button facebook">
                                <svg width="24" height="24" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25C22.56 6.82 18.15 2.42 12.75 2.42C7.34 2.42 2.94 6.83 2.94 12.25C2.94 17.16 6.45 21.22 11.04 22V15.03H8.58V12.25H11.05V10.12C11.05 7.73 12.47 6.42 14.66 6.42C15.71 6.42 16.81 6.59 16.81 6.59V8.95H15.59C14.39 8.95 14.02 9.73 14.02 10.52V12.25H16.69L16.27 15.03H14.01V22C18.6 21.22 22.56 17.16 22.56 12.25Z" fill="#1877F2" />
                                </svg>
                                <span>Facebook</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Background elements */}
                <div className="animated-background">
                    <div className="bg-circle circle-1"></div>
                    <div className="bg-circle circle-2"></div>
                    <div className="bg-circle circle-3"></div>
                </div>
            </div>
        </div>
    );
});

export default ModernAuthModal;