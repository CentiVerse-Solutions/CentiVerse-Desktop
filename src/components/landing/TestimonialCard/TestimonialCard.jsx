import React, { useRef, useEffect } from 'react';
import './TestimonialCard.css';

// Avatar mapping - in a real app, this would come from your backend
const avatarMap = {
    avatar1: '/assets/images/avatar1.jpg',
    avatar2: '/assets/images/avatar2.jpg'
};

const TestimonialCard = ({ name, text, avatar, index = 0 }) => {
    const cardRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setTimeout(() => {
                            entry.target.classList.add('testimonial-card-visible');
                        }, index * 200); // Stagger the animation based on index
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.2 }
        );

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => {
            if (cardRef.current) {
                observer.unobserve(cardRef.current);
            }
        };
    }, [index]);

    return (
        <div className="testimonial-card" ref={cardRef}>
            <div className="quote-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 11H6C4.89543 11 4 10.1046 4 9V7C4 5.89543 4.89543 5 6 5H8C9.10457 5 10 5.89543 10 7V11ZM10 11V13C10 15.2091 8.20914 17 6 17H4.5M20 11H16C14.8954 11 14 10.1046 14 9V7C14 5.89543 14.8954 5 16 5H18C19.1046 5 20 5.89543 20 7V11ZM20 11V13C20 15.2091 18.2091 17 16 17H14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
            <div className="card-content">
                <p className="testimonial-text">{text}</p>
                <div className="testimonial-author">
                    <div className="avatar-container">
                        {/* <img
                            src={avatarMap[avatar]}
                            alt={name}
                            className="testimonial-avatar"
                        /> */}
                    </div>
                    <span className="testimonial-name">{name}</span>
                </div>
            </div>
            <div className="card-decoration">
                <div className="decoration-dot dot-1"></div>
                <div className="decoration-dot dot-2"></div>
                <div className="decoration-dot dot-3"></div>
            </div>
        </div>
    );
};

export default TestimonialCard;