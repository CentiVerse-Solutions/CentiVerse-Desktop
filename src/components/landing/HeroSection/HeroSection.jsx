import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../../common/Button/Button';
import RotatingText from '../../common/RotatingText/RotatingText';
import SplitText from '../../common/SplitText/SplitText';
import './HeroSection.css';

// Simple Split Text Component (add this directly in the file for now)
const SimpleSplitText = ({
    text,
    className = '',
    delay = 50,
    duration = 500,
    easing = 'cubic-bezier(0.17, 0.67, 0.83, 0.67)',
    onComplete = () => { }
}) => {
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const letters = container.querySelectorAll('.split-letter');

        // Reset all letters to initial state
        letters.forEach(letter => {
            letter.style.opacity = '0';
            letter.style.transform = 'translateY(20px)';
        });

        // Animate letters in sequence
        letters.forEach((letter, index) => {
            setTimeout(() => {
                letter.style.transition = `all ${duration}ms ${easing}`;
                letter.style.opacity = '1';
                letter.style.transform = 'translateY(0)';

                // Call onComplete when the last letter animation starts
                if (index === letters.length - 1) {
                    setTimeout(onComplete, duration);
                }
            }, index * delay);
        });
    }, [text, delay, duration, easing, onComplete]);

    // Split text into array of characters for rendering
    const characters = text.split('');

    return (
        <div ref={containerRef} className={className}>
            {characters.map((char, index) => (
                <span
                    key={`${char}-${index}`}
                    className="split-letter"
                    style={{
                        display: 'inline-block',
                        opacity: 0,
                        transform: 'translateY(20px)',
                        transition: `all ${duration}ms ${easing}`,
                        ...(char === ' ' ? { marginRight: '0.25em' } : {})
                    }}
                >
                    {char === ' ' ? '\u00A0' : char}
                </span>
            ))}
        </div>
    );
};

const HeroSection = ({ ctaAction }) => {
    const heroRef = useRef(null);
    const titleRef = useRef(null);
    const subtitleRef = useRef(null);
    const ctaRef = useRef(null);
    const imageRef = useRef(null);
    const [titleAnimationComplete, setTitleAnimationComplete] = useState(false);

    useEffect(() => {
        // Animate elements when component mounts
        const heroElement = heroRef.current;
        const titleElement = titleRef.current;
        const subtitleElement = subtitleRef.current;
        const ctaElement = ctaRef.current;
        const imageElement = imageRef.current;

        if (heroElement && titleElement && subtitleElement && ctaElement && imageElement) {
            // Set initial opacity for fade-in animation
            heroElement.style.opacity = '1';

            // Add animation classes with delays - subtitle depends on title animation
            setTimeout(() => titleElement.classList.add('animate-in'), 300);
            setTimeout(() => ctaElement.classList.add('animate-in'), 900);
            setTimeout(() => imageElement.classList.add('animate-in'), 1200);
        }
    }, []);

    // Handle title animation complete
    const handleTitleAnimationComplete = () => {
        setTitleAnimationComplete(true);
        setTimeout(() => {
            const subtitleElement = subtitleRef.current;
            if (subtitleElement) {
                subtitleElement.classList.add('animate-in');
            }
        }, 100);
    };

    return (
        <section className="hero-section" ref={heroRef}>
            {/* Add inline style for gradient text */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .gradient-text {
                    background: linear-gradient(135deg, var(--teal) 0%, var(--dark-accent) 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    display: block;
                    font-size: 3.8rem;
                    font-weight: 800;
                    line-height: 1.2;
                    letter-spacing: -0.5px;
                    margin-top: 0.25rem;
                }
                
                .gradient-text .split-letter {
                    background: inherit;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                
                @media (max-width: 768px) {
                    .gradient-text {
                        font-size: 3rem;
                    }
                }
                
                @media (max-width: 480px) {
                    .gradient-text {
                        font-size: 2.2rem;
                    }
                }
            `}} />

            <div className="floating-shape shape-1"></div>
            <div className="floating-shape shape-2"></div>
            <div className="floating-shape shape-3"></div>
            <div className="floating-shape shape-4"></div>

            <div className="hero-content">
                <div ref={titleRef} className="hero-title-container">
                    <SplitText
                        text="Track expenses"
                        className="hero-title-split"
                        delay={50}
                        animationFrom={{ opacity: 0, transform: 'translate3d(0,50px,0)' }}
                        animationTo={{ opacity: 1, transform: 'translate3d(0,0,0)' }}
                        easing="easeOutQuint"
                        threshold={0.1}
                        rootMargin="-20px"
                        textAlign="left"
                        onLetterAnimationComplete={handleTitleAnimationComplete}
                    />

                    <div className="rotating-text-wrapper">
                        <span className="with-text">with</span>
                        <RotatingText
                            texts={[
                                'friends',
                                'roommates',
                                'family',
                                'partners',
                                'teammates'
                            ]}
                            mainClassName="rotating-text-container"
                            staggerFrom="last"
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "-120%" }}
                            staggerDuration={0.02}
                            splitLevelClassName="rotating-text-word"
                            elementLevelClassName="rotating-text-element"
                            transition={{ type: "spring", damping: 30, stiffness: 400 }}
                            rotationInterval={2500}
                        />
                    </div>

                    {/* Use our custom SimpleSplitText component for the effortlessly text */}
                    <div className="gradient-text-wrapper">
                        <SimpleSplitText
                            text="effortlessly"
                            className="gradient-text"
                            delay={40}
                            duration={600}
                            easing="cubic-bezier(0.19, 1, 0.22, 1)"
                        />
                    </div>
                </div>

                <p ref={subtitleRef} className="hero-subtitle">
                    Keep track of shared expenses and balances with housemates,
                    friends, family, and more. Split bills, track debts, and settle up
                    with a few taps to make sharing expenses fair and simple.
                </p>

                <div ref={ctaRef} className="hero-cta-container">
                    <Button
                        variant="contained"
                        onClick={ctaAction}
                        className="hero-cta"
                        size="large"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14"></path>
                                <path d="M12 5l7 7-7 7"></path>
                            </svg>
                        }
                    >
                        Get Started — It's Free
                    </Button>

                    <div className="cta-features">
                        <div className="cta-feature">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            <span>No credit card required</span>
                        </div>
                        <div className="cta-feature">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            <span>Free for personal use</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="hero-image" ref={imageRef}>
                <div className="image-container">
                    <div className="app-preview-container">
                        <div className="app-preview-screen">
                            <div className="app-mockup-header">
                                <div className="app-mockup-title">Group expenses</div>
                                <div className="app-mockup-avatar-group">
                                    <div className="app-mockup-avatar"></div>
                                    <div className="app-mockup-avatar"></div>
                                    <div className="app-mockup-avatar"></div>
                                </div>
                            </div>
                            <div className="app-mockup-content">
                                <div className="app-mockup-expense">
                                    <div className="app-mockup-expense-info">
                                        <div className="app-mockup-expense-title">Dinner</div>
                                        <div className="app-mockup-expense-amount">$120.00</div>
                                    </div>
                                    <div className="app-mockup-expense-paid">You paid</div>
                                </div>
                                <div className="app-mockup-expense">
                                    <div className="app-mockup-expense-info">
                                        <div className="app-mockup-expense-title">Groceries</div>
                                        <div className="app-mockup-expense-amount">$85.50</div>
                                    </div>
                                    <div className="app-mockup-expense-paid">Alex paid</div>
                                </div>
                                <div className="app-mockup-expense">
                                    <div className="app-mockup-expense-info">
                                        <div className="app-mockup-expense-title">Movie tickets</div>
                                        <div className="app-mockup-expense-amount">$45.00</div>
                                    </div>
                                    <div className="app-mockup-expense-paid">Sam paid</div>
                                </div>
                            </div>
                            <div className="app-mockup-balance-summary">
                                <div className="balance-title">Your balance</div>
                                <div className="balance-amount">+$26.83</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;