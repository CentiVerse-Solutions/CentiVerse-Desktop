import React, { useRef, useState } from 'react';
import './InteractiveHoverButton.css';

export function InteractiveHoverButton({
    children,
    className = '',
    variant = 'default',
    onClick,
    ...props
}) {
    const buttonRef = useRef(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);

    // Calculate coordinates for the spotlight effect
    const handleMouseMove = (e) => {
        if (!buttonRef.current) return;

        const rect = buttonRef.current.getBoundingClientRect();
        setPosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    // Handle mouse enter/leave events
    const handleMouseEnter = () => {
        setIsHovering(true);
    };

    const handleMouseLeave = () => {
        setIsHovering(false);
    };

    // Determine the button classes based on variant
    const buttonClasses = `interactive-hover-button ${variant === 'primary' ? 'primary' : variant === 'outlined' ? 'outlined' : 'default'} ${className} ${isHovering ? 'hovering' : ''}`;

    return (
        <button
            ref={buttonRef}
            className={buttonClasses}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            {...props}
        >
            <span className="hover-button-content">{children}</span>
            {isHovering && (
                <div
                    className="spotlight-effect"
                    style={{
                        left: `${position.x}px`,
                        top: `${position.y}px`,
                    }}
                />
            )}
        </button>
    );
}

export default InteractiveHoverButton;