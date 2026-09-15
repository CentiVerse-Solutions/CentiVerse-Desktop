import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

/**
 * 7.4 -- split out of SideNavbar verbatim (behaviour-preserving).
 */
const SideNavLinks = ({
    currentPath,
    itemVariants,
}) => (
    <motion.div className="side-nav-main-links" variants={itemVariants}>
        {[
            { path: "/dashboard", icon: "🏠", label: "Dashboard" },
            { path: "/activity", icon: "📊", label: "Activity" },
            { path: "/friends", icon: "👥", label: "Friends" },
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
);

export default SideNavLinks;
