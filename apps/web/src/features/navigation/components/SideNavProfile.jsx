import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

/**
 * 7.4 -- split out of SideNavbar verbatim (behaviour-preserving).
 */
const SideNavProfile = ({
    viewer,
    itemVariants,
}) => (
    <motion.div className="user-profile-section" variants={itemVariants}>
        <Link to="/account" className="user-profile-link">
            <div className="user-avatar">
                <img src={viewer?.avatar} alt="Your profile" />
            </div>
            <div className="user-info">
                <span className="user-name">{viewer?.name ?? '—'}</span>
                <span className="user-email">{viewer?.email ?? ''}</span>
            </div>
        </Link>
    </motion.div>
);

export default SideNavProfile;
