import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';
import {Button} from '../../components/common/Button/Button';
import AuthModal from '../../components/auth/AuthModal';
import FeatureCard from '../../components/landing/FeatureCard/FeatureCard';
import HeroSection from '../../components/landing/HeroSection/HeroSection';
import TestimonialCard from '../../components/landing/TestimonialCard/TestimonialCard';
import Header from '../../components/layout/Header/Header';

// This would be fetched from an API in a real scenario
const featuresData = [
    {
        id: 1,
        title: 'Smart Expense Splitting',
        description: 'Split expenses by percentage, shares, or exact amounts with our intelligent calculator.',
        icon: 'calculator'
    },
    {
        id: 2,
        title: 'Simplified Settlements',
        description: 'One-tap settling with the most efficient payment paths, minimizing the number of transactions.',
        icon: 'wallet'
    },
    {
        id: 3,
        title: 'Real-time Tracking',
        description: 'Track expenses and balances in real-time across all your groups and friends.',
        icon: 'chart'
    },
    {
        id: 4,
        title: 'Receipt Scanning',
        description: 'Snap a photo of your receipt and let us automatically extract the details.',
        icon: 'camera'
    }
];

const testimonials = [
    {
        id: 1,
        name: 'Alex Johnson',
        text: 'This app has transformed how my roommates and I handle our shared expenses. No more awkward money conversations!',
        avatar: 'avatar1'
    },
    {
        id: 2,
        name: 'Sarah Miller',
        text: 'I use this for everything from group trips to splitting dinner bills. The UI is so intuitive and clean.',
        avatar: 'avatar2'
    }
];

const LandingPage = () => {
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
    const [scrolled, setScrolled] = useState(false);
    const navigate = useNavigate();
    const featuresRef = useRef(null);
    const howItWorksRef = useRef(null);
    const testimonialsRef = useRef(null);

    // Handle scroll animations
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);

            // Add animation for sections when they come into view
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('section-visible');
                            observer.unobserve(entry.target);
                        }
                    });
                },
                { threshold: 0.2 }
            );

            [featuresRef, howItWorksRef, testimonialsRef].forEach(ref => {
                if (ref.current) observer.observe(ref.current);
            });
        };

        handleScroll(); // Run once on mount
        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const openAuthModal = (mode) => {
        setAuthMode(mode);
        setAuthModalOpen(true);
    };

    return (
        <div className="landing-page">
            <Header scrolled={scrolled} openAuthModal={openAuthModal} />

            <main>
                <HeroSection
                    title="Split Expenses, Keep Friendships"
                    subtitle="The smartest way to track expenses, split bills, and share costs with friends and groups."
                    ctaAction={() => openAuthModal('signup')}
                />

                <section id="features" className="features-section animate-section" ref={featuresRef}>
                    <div className="section-header">
                        <h2 className="section-title">Why Choose CentiVerse?</h2>
                        <p className="section-subtitle">Powerful features to make expense sharing simple and stress-free</p>
                    </div>
                    <div className="features-grid">
                        {featuresData.map((feature, index) => (
                            <FeatureCard
                                key={feature.id}
                                title={feature.title}
                                description={feature.description}
                                icon={feature.icon}
                                index={index}
                            />
                        ))}
                    </div>
                </section>

                <section id="how-it-works" className="how-it-works animate-section" ref={howItWorksRef}>
                    <div className="section-header">
                        <h2 className="section-title">How It Works</h2>
                        <p className="section-subtitle">Get started in just a few simple steps</p>
                    </div>
                    <div className="steps-container">
                        <div className="step">
                            <div className="step-number">1</div>
                            <div className="step-icon">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17 21V19C17 16.7909 15.2091 15 13 15H5C2.79086 15 1 16.7909 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M23 21V19C22.9986 17.1771 21.765 15.5857 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M16 3.13C17.7699 3.58317 19.0078 5.17799 19.0078 7.005C19.0078 8.83201 17.7699 10.4268 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h3>Create a Group</h3>
                            <p>Start a group for your roommates, trip, project, or anything else that involves shared expenses.</p>
                        </div>
                        <div className="step">
                            <div className="step-number">2</div>
                            <div className="step-icon">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 1V23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h3>Add Expenses</h3>
                            <p>Record who paid for what and how it should be split between group members.</p>
                        </div>
                        <div className="step">
                            <div className="step-number">3</div>
                            <div className="step-icon">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M23 6L13.5 15.5L8.5 10.5L1 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M17 6H23V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h3>Settle Up</h3>
                            <p>See who owes what with the clearest payment paths, making it easy to settle debts.</p>
                        </div>
                    </div>
                </section>

                <section id="testimonials" className="testimonials-section animate-section" ref={testimonialsRef}>
                    <div className="section-header">
                        <h2 className="section-title">What Our Users Say</h2>
                        <p className="section-subtitle">Join thousands of satisfied users who love CentiVerse</p>
                    </div>
                    <div className="testimonials-container">
                        {testimonials.map((testimonial, index) => (
                            <TestimonialCard
                                key={testimonial.id}
                                name={testimonial.name}
                                text={testimonial.text}
                                avatar={testimonial.avatar}
                                index={index}
                            />
                        ))}
                    </div>
                </section>

                <section className="cta-section">
                    <div className="cta-content">
                        <h2>Ready to Get Started?</h2>
                        <p>Join thousands of people who trust CentiVerse for their shared expenses</p>
                        <Button
                            variant="contained"
                            onClick={() => openAuthModal('signup')}
                            className="cta-button"
                            size="large"
                        >
                            Create Your Free Account
                        </Button>
                    </div>
                    <div className="cta-decoration">
                        <div className="decoration-circle circle-1"></div>
                        <div className="decoration-circle circle-2"></div>
                        <div className="decoration-circle circle-3"></div>
                    </div>
                </section>
            </main>

            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <div className="footer-logo">
                            <img src="/assets/logos/app-logo.svg" alt="CentiVerse Logo" className="logo-small" />
                            <span>CentiVerse</span>
                        </div>
                        <p className="footer-tagline">
                            Making shared expenses simple and stress-free.
                        </p>
                        <div className="social-links">
                            <a href="#" className="social-link">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.5 5.65C21.66 6.05 20.86 6.3 20 6.47C20.88 5.9 21.56 5 21.88 3.97C21.12 4.5 20.16 4.84 19.29 5.07C18.58 4.13 17.56 3.6 16.35 3.6C14.07 3.6 12.21 5.43 12.21 7.7C12.21 8.02 12.25 8.34 12.32 8.63C8.9 8.46 5.9 6.8 3.8 4.27C3.45 4.9 3.26 5.6 3.26 6.36C3.26 7.79 3.99 9.05 5.03 9.72C4.38 9.72 3.8 9.5 3.26 9.21V9.23C3.26 11.24 4.67 12.87 6.55 13.25C5.94 13.41 5.35 13.44 4.77 13.31C5.25 14.93 6.75 16.05 8.52 16.07C7.12 17.15 5.32 17.72 3.53 17.72C3.19 17.72 2.86 17.7 2.53 17.65C4.3 18.79 6.45 19.39 8.66 19.39C16.33 19.39 20.51 13.34 20.51 8.14C20.51 7.95 20.51 7.77 20.5 7.59C21.28 6.95 21.88 6.2 22.5 5.32V5.65Z" fill="currentColor" />
                                </svg>
                            </a>
                            <a href="#" className="social-link">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z" fill="currentColor" />
                                </svg>
                            </a>
                            <a href="#" className="social-link">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2C6.48 2 2 6.48 2 12C2 16.42 4.87 20.17 8.84 21.5C9.34 21.58 9.5 21.27 9.5 21C9.5 20.77 9.5 20.14 9.5 19.31C6.73 19.91 6.14 17.97 6.14 17.97C5.68 16.81 5.03 16.5 5.03 16.5C4.12 15.88 5.1 15.9 5.1 15.9C6.1 15.97 6.63 16.93 6.63 16.93C7.5 18.45 8.97 18 9.54 17.76C9.63 17.11 9.89 16.67 10.17 16.42C7.95 16.17 5.62 15.31 5.62 11.5C5.62 10.39 6 9.5 6.65 8.79C6.55 8.54 6.2 7.5 6.75 6.15C6.75 6.15 7.59 5.88 9.5 7.17C10.29 6.95 11.15 6.84 12 6.84C12.85 6.84 13.71 6.95 14.5 7.17C16.41 5.88 17.25 6.15 17.25 6.15C17.8 7.5 17.45 8.54 17.35 8.79C18 9.5 18.38 10.39 18.38 11.5C18.38 15.32 16.04 16.16 13.81 16.41C14.17 16.72 14.5 17.33 14.5 18.26C14.5 19.6 14.5 20.68 14.5 21C14.5 21.27 14.66 21.59 15.17 21.5C19.14 20.16 22 16.42 22 12C22 6.48 17.52 2 12 2Z" fill="currentColor" />
                                </svg>
                            </a>
                        </div>
                    </div>
                    <div className="footer-links">
                        <div className="link-group">
                            <h4>Product</h4>
                            <ul>
                                <li><a href="#features">Features</a></li>
                                <li><a href="#pricing">Pricing</a></li>
                                <li><a href="#faq">FAQ</a></li>
                            </ul>
                        </div>
                        <div className="link-group">
                            <h4>Company</h4>
                            <ul>
                                <li><a href="#about">About Us</a></li>
                                <li><a href="#contact">Contact</a></li>
                                <li><a href="#careers">Careers</a></li>
                            </ul>
                        </div>
                        <div className="link-group">
                            <h4>Resources</h4>
                            <ul>
                                <li><a href="#blog">Blog</a></li>
                                <li><a href="#support">Support</a></li>
                                <li><a href="#privacy">Privacy Policy</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="copyright">
                    &copy; {new Date().getFullYear()} CentiVerse. All rights reserved.
                </div>
            </footer>

            <AuthModal
                isOpen={authModalOpen}
                onClose={() => setAuthModalOpen(false)}
                initialMode={authMode}
                onSuccessfulAuth={() => navigate('/dashboard')}
            />
        </div>
    );
};

export default LandingPage;