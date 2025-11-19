import React from 'react';
import { InteractiveHoverButton } from '../../common/InteractiveHoverButton/InteractiveHoverButton';
import './Header.css';

const Header = ({ scrolled, openAuthModal }) => {
    return (
        <header className={`landing-header ${scrolled ? 'scrolled' : ''}`}>
            <div className="logo-container">
                <div className="logo-wrapper">
                    <img src="/assets/logos/app-logo.svg" alt="CentiVerse Logo" className="logo" />
                </div>
                <h1>CentiVerse</h1>
            </div>
            <div className="header-nav">
                <nav className="main-nav">
                    <a href="#features" className="nav-link">
                        <span className="nav-link-text">Features</span>
                    </a>
                    <a href="#how-it-works" className="nav-link">
                        <span className="nav-link-text">How It Works</span>
                    </a>
                    <a href="#testimonials" className="nav-link">
                        <span className="nav-link-text">Testimonials</span>
                    </a>
                </nav>
                <div className="auth-buttons">
                    <InteractiveHoverButton
                        variant="outlined"
                        onClick={() => openAuthModal('login')}
                        className="login-button"
                    >
                        Log In
                    </InteractiveHoverButton>
                    <InteractiveHoverButton
                        variant="primary"
                        onClick={() => openAuthModal('signup')}
                        className="signup-button"
                    >
                        Sign Up
                    </InteractiveHoverButton>
                </div>
            </div>
            {/* Mobile menu button - only shown on small screens */}
            <button className="mobile-menu-button" aria-label="Menu">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
        </header>
    );
};

export default Header;