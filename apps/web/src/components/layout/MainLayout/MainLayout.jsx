import React, { useState, useEffect } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import SideNavbar from '../SideNavbar/SideNavbar';
import './MainLayout.css';

// Import mock data for testing (replace with your actual data source)
import { mockGroups } from '../../../utils/mockData';

const MainLayout = () => {
    const [isNavOpen, setIsNavOpen] = useState(window.innerWidth >= 992);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
    const location = useLocation();

    // Check screen size on mount and window resize with debounce
    useEffect(() => {
        let timeoutId;

        const handleResize = () => {
            clearTimeout(timeoutId);

            timeoutId = setTimeout(() => {
                const mobile = window.innerWidth < 992;
                setIsMobile(mobile);

                // Auto-open sidebar on desktop
                if (!mobile && !isNavOpen) {
                    setIsNavOpen(true);
                }
            }, 100); // 100ms debounce
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial check

        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timeoutId);
        };
    }, [isNavOpen]);

    // Close sidebar when route changes on mobile
    useEffect(() => {
        if (isMobile) {
            setIsNavOpen(false);
        }
    }, [location.pathname, isMobile]);

    const toggleSideNav = (value) => {
        if (typeof value === 'boolean') {
            setIsNavOpen(value);
        } else {
            setIsNavOpen(!isNavOpen);
        }
    };

    return (
        <div className="app-container">
            <SideNavbar
                isOpen={isNavOpen}
                toggleSideNav={toggleSideNav}
                groups={mockGroups}
            />

            <main className={`main-content ${isNavOpen && !isMobile ? 'with-sidebar' : ''}`}>
                {/* Mobile only top nav */}
                {isMobile && (
                    <div className="top-nav">
                        <button
                            className="menu-toggle"
                            onClick={() => toggleSideNav()}
                            aria-label={isNavOpen ? "Close menu" : "Open menu"}
                        >
                            ☰
                        </button>
                        <h1 className="app-title">CentiVerse</h1>
                        <div className="user-profile">
                            <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Profile" />
                        </div>
                    </div>
                )}

                {/* Main Content - Renders the current route via Outlet */}
                <div className="content-container">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MainLayout;