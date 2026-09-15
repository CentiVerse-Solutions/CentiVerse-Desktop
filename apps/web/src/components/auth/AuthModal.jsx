import React, { useState, useEffect, useRef } from 'react';
import './AuthModal.css';
import PasswordField from '../../features/auth/components/PasswordField';
import SocialAuthButtons from '../../features/auth/components/SocialAuthButtons';
import AuthHeader from '../../features/auth/components/AuthHeader';
import AuthModeTabs from '../../features/auth/components/AuthModeTabs';
import SignupNameField from '../../features/auth/components/SignupNameField';
import SignupFields from '../../features/auth/components/SignupFields';

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
                    <AuthHeader
                        mode={mode}
                    />

                    <AuthModeTabs
                        mode={mode}
                        switchMode={switchMode}
                    />

                    <form onSubmit={handleSubmit} className="modern-auth-form" ref={formRef}>
                        {mode === 'signup' && (
                            <SignupNameField
                                errors={errors}
                                formData={formData}
                                handleChange={handleChange}
                            />
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

                        <PasswordField
                            errors={errors}
                            formData={formData}
                            handleChange={handleChange}
                            showPassword={showPassword}
                            togglePasswordVisibility={togglePasswordVisibility}
                        />

                        {mode === 'signup' && (
                            <SignupFields
                                errors={errors}
                                formData={formData}
                                handleChange={handleChange}
                                showConfirmPassword={showConfirmPassword}
                                togglePasswordVisibility={togglePasswordVisibility}
                            />
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

                    <SocialAuthButtons />
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