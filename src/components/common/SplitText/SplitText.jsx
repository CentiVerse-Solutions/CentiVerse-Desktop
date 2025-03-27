import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const SplitText = ({
    text = '',
    className = '',
    delay = 100,
    animationFrom = { opacity: 0, y: 40 },
    animationTo = { opacity: 1, y: 0 },
    easing = "easeOut",
    threshold = 0.1,
    rootMargin = '-100px',
    textAlign = 'center',
    onLetterAnimationComplete,
}) => {
    const words = text.split(' ').map(word => word.split(''));
    const letters = words.flat();
    const [inView, setInView] = useState(false);
    const ref = useRef();
    const completedAnimations = useRef(0);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    observer.unobserve(ref.current);
                }
            },
            { threshold, rootMargin }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, [threshold, rootMargin]);

    const container = {
        hidden: { opacity: 0 },
        visible: (i = 1) => ({
            opacity: 1,
            transition: { staggerChildren: delay / 1000, delayChildren: 0.05 * i },
        }),
    };

    const handleAnimationComplete = () => {
        completedAnimations.current += 1;
        if (completedAnimations.current === letters.length && onLetterAnimationComplete) {
            onLetterAnimationComplete();
        }
    };

    const child = {
        hidden: {
            ...animationFrom,
        },
        visible: {
            ...animationTo,
            transition: {
                type: easing,
                duration: 0.5,
            },
        },
    };

    return (
        <motion.p
            ref={ref}
            className={`split-parent ${className}`}
            style={{
                textAlign,
                overflow: 'hidden',
                display: 'inline',
                whiteSpace: 'normal',
                wordWrap: 'break-word'
            }}
            variants={container}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
        >
            {words.map((word, wordIndex) => (
                <span key={wordIndex} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
                    {word.map((letter, letterIndex) => (
                        <motion.span
                            key={letterIndex}
                            variants={child}
                            style={{
                                display: 'inline-block',
                                willChange: 'transform, opacity',
                            }}
                            onAnimationComplete={handleAnimationComplete}
                        >
                            {letter}
                        </motion.span>
                    ))}
                    <span style={{ display: 'inline-block', width: '0.3em' }}>&nbsp;</span>
                </span>
            ))}
        </motion.p>
    );
};

export default SplitText;