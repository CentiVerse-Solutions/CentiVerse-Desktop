import type { Person } from '../../../data/port';
import type { Variants } from 'framer-motion';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

/**
 * 7.4 -- split out of SideNavbar verbatim (behaviour-preserving).
 */
interface SideNavProfileProps {
    viewer: Person | undefined;
    itemVariants: Variants;
}

const SideNavProfile = ({
    viewer,
    itemVariants,
}: SideNavProfileProps) => (
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
