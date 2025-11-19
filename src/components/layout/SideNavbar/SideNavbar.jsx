import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './SideNavbar.css';

const SideNavbar = ({ isOpen, toggleSideNav, groups }) => {
    const location = useLocation();
    const currentPath = location.pathname;
    const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
    const [isOverlayVisible, setIsOverlayVisible] = useState(false);

    // Check screen size on mount and window resize
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 992;
            setIsMobile(mobile);

            // If we're on desktop, ensure sidebar is visible
            if (!mobile && !isOpen) {
                toggleSideNav(true);
            }
        };

        // Set overlay visibility when sidebar opens on mobile
        setIsOverlayVisible(isMobile && isOpen);

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isMobile, isOpen, toggleSideNav]);

    // Handle click outside to close on mobile
    const handleOverlayClick = (e) => {
        if (isMobile && isOpen) {
            toggleSideNav(false);
        }
    };

    // Keyboard accessibility
    const handleKeyDown = (e) => {
        if (e.key === 'Escape' && isOpen) {
            toggleSideNav(false);
        }
    };

    // Animation variants
    const sidebarVariants = {
        open: {
            x: 0,
            boxShadow: "5px 0 25px rgba(0, 0, 0, 0.1)",
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 24,
                staggerChildren: 0.07,
                delayChildren: 0.1
            }
        },
        closed: {
            x: "-100%",
            boxShadow: "none",
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 40,
                staggerChildren: 0.05,
                staggerDirection: -1
            }
        }
    };

    const itemVariants = {
        open: {
            x: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 24
            }
        },
        closed: {
            x: -20,
            opacity: 0,
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 40
            }
        }
    };

    const overlayVariants = {
        open: {
            opacity: 0.5,
            display: "block",
            transition: { duration: 0.2 }
        },
        closed: {
            opacity: 0,
            transitionEnd: {
                display: "none"
            },
            transition: { duration: 0.2 }
        }
    };

    // Split groups into pinned and regular
    const pinnedGroups = groups ? groups.filter(group => group.isPinned) : [];
    const regularGroups = groups ? groups.filter(group => !group.isPinned) : [];

    // If there's no explicit isPinned property, just use the first 3 groups as "pinned"
    const displayPinnedGroups = pinnedGroups.length > 0 ?
        pinnedGroups :
        (groups ? groups.slice(0, Math.min(3, groups.length)) : []);

    const displayRegularGroups = pinnedGroups.length > 0 ?
        regularGroups :
        (groups ? groups.slice(Math.min(3, groups.length)) : []);

    return (
        <>
            {/* Mobile overlay */}
            <AnimatePresence>
                {isMobile && isOpen && (
                    <motion.div
                        className="side-nav-overlay"
                        initial="closed"
                        animate={isOpen ? "open" : "closed"}
                        exit="closed"
                        variants={overlayVariants}
                        onClick={handleOverlayClick}
                        role="presentation"
                    />
                )}
            </AnimatePresence>

            {/* Side navigation */}
            <motion.nav
                className={`side-nav ${isOpen ? 'open' : ''}`}
                initial="closed"
                animate={isOpen ? "open" : "closed"}
                variants={sidebarVariants}
                onKeyDown={handleKeyDown}
                aria-expanded={isOpen}
                aria-label="Main navigation"
                role="navigation"
            >
                <div className="side-nav-header">
                    <motion.h2
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        CentiVerse
                    </motion.h2>
                    {isMobile && (
                        <motion.button
                            className="close-nav-btn"
                            onClick={() => toggleSideNav(false)}
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            aria-label="Close navigation"
                        >
                            ×
                        </motion.button>
                    )}
                </div>

                {/* Create New Group Button */}
                <motion.div
                    className="create-group-btn-container"
                    variants={itemVariants}
                >
                    <motion.button
                        className="create-group-btn"
                        whileHover={{ y: -3, boxShadow: "0 6px 20px rgba(105, 162, 151, 0.4)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => console.log("Create new group")}
                    >
                        <span className="btn-icon">+</span>
                        <span className="btn-text">Create New Group</span>
                    </motion.button>
                </motion.div>

                {/* Pinned Groups Section */}
                {displayPinnedGroups.length > 0 && (
                    <div className="side-nav-section">
                        <motion.h3
                            className="section-title"
                            variants={itemVariants}
                        >
                            Pinned Groups
                        </motion.h3>
                        <div className="side-nav-groups">
                            {displayPinnedGroups.map((group) => (
                                <motion.div key={group.id} variants={itemVariants}>
                                    <Link
                                        to={`/groups/${group.id}`}
                                        className={`nav-group-item ${currentPath === `/groups/${group.id}` ? 'active' : ''}`}
                                        aria-current={currentPath === `/groups/${group.id}` ? 'page' : undefined}
                                    >
                                        <div className="nav-group-avatar">
                                            <img
                                                src={group.avatar}
                                                alt=""
                                                aria-hidden="true"
                                            />
                                        </div>
                                        <div className="nav-group-info">
                                            <span className="nav-group-name">{group.name}</span>
                                            {group.unreadCount > 0 && (
                                                <span className="unread-badge">{group.unreadCount}</span>
                                            )}
                                        </div>
                                        <motion.button
                                            className="group-options-btn"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                console.log("Group options for", group.name);
                                            }}
                                            aria-label={`Options for ${group.name}`}
                                        >
                                            ⋮
                                        </motion.button>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Regular Groups Section */}
                <div className="side-nav-section">
                    <motion.h3
                        className="section-title"
                        variants={itemVariants}
                    >
                        Your Groups
                    </motion.h3>
                    <div className="side-nav-groups">
                        {displayRegularGroups.length > 0 ? (
                            displayRegularGroups.map((group) => (
                                <motion.div key={group.id} variants={itemVariants}>
                                    <Link
                                        to={`/groups/${group.id}`}
                                        className={`nav-group-item ${currentPath === `/groups/${group.id}` ? 'active' : ''}`}
                                        aria-current={currentPath === `/groups/${group.id}` ? 'page' : undefined}
                                    >
                                        <div className="nav-group-avatar">
                                            <img
                                                src={group.avatar}
                                                alt=""
                                                aria-hidden="true"
                                            />
                                        </div>
                                        <div className="nav-group-info">
                                            <span className="nav-group-name">{group.name}</span>
                                            {group.unreadCount > 0 && (
                                                <span className="unread-badge">{group.unreadCount}</span>
                                            )}
                                        </div>
                                        <motion.button
                                            className="group-options-btn"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                console.log("Group options for", group.name);
                                            }}
                                            aria-label={`Options for ${group.name}`}
                                        >
                                            ⋮
                                        </motion.button>
                                    </Link>
                                </motion.div>
                            ))
                        ) : (
                            <motion.div
                                className="empty-groups-message"
                                variants={itemVariants}
                            >
                                <p>No groups found</p>
                                <button
                                    className="create-first-group-btn"
                                    onClick={() => console.log("Create first group")}
                                >
                                    Create your first group
                                </button>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Main Navigation Links */}
                <motion.div className="side-nav-main-links" variants={itemVariants}>
                    {[
                        { path: "/dashboard", icon: "🏠", label: "Dashboard" },
                        { path: "/activity", icon: "📊", label: "Activity" },
                        { path: "/friends", icon: "👥", label: "Friends" },
                        { path: "/settings", icon: "⚙️", label: "Settings" }
                    ].map((item) => (
                        <motion.div key={item.path} variants={itemVariants}>
                            <Link
                                to={item.path}
                                className={`nav-main-item ${currentPath === item.path ? 'active' : ''}`}
                                aria-current={currentPath === item.path ? 'page' : undefined}
                            >
                                <div className="nav-icon">
                                    {item.icon}
                                </div>
                                <span>{item.label}</span>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>

                {/* User Profile Section */}
                <motion.div className="user-profile-section" variants={itemVariants}>
                    <Link to="/account" className="user-profile-link">
                        <div className="user-avatar">
                            <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Your profile" />
                        </div>
                        <div className="user-info">
                            <span className="user-name">Your Name</span>
                            <span className="user-email">your.email@example.com</span>
                        </div>
                    </Link>
                </motion.div>
            </motion.nav>
        </>
    );
};

export default SideNavbar;