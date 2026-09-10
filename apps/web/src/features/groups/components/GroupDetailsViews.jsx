import { motion } from 'framer-motion';

/**
 * 7.4 -- GroupDetails' loading / error / not-found views, lifted verbatim so
 * the page component stays under the 300-line limit. Behaviour-preserving:
 * identical markup, animation and ARIA wiring.
 */

export const GroupLoadingView = () => (
    <div className="loading-container" role="alert" aria-live="polite">
        <motion.div
            className="loading-spinner"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            aria-hidden="true"
        ></motion.div>
        <motion.div className="loading-skeleton">
            <div className="skeleton-header"></div>
            <div className="skeleton-group">
                <div className="skeleton-avatar"></div>
                <div className="skeleton-text">
                    <div className="skeleton-title"></div>
                    <div className="skeleton-subtitle"></div>
                </div>
            </div>
            <div className="skeleton-tabs"></div>
            <div className="skeleton-cards">
                <div className="skeleton-card"></div>
                <div className="skeleton-card"></div>
                <div className="skeleton-card"></div>
            </div>
        </motion.div>
    </div>
);

export const GroupErrorView = ({ error, onRetry }) => (
    <div className="error-container">
        <motion.div
            className="error-icon"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
        >
            ⚠️
        </motion.div>
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <motion.button
            className="action-btn primary"
            onClick={onRetry}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            Try Again
        </motion.button>
    </div>
);

export const GroupNotFoundView = ({ onBack }) => (
    <div className="error-container">
        <motion.div
            className="error-icon"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
        >
            🔍
        </motion.div>
        <h2>Group Not Found</h2>
        <p>We couldn't find the group you're looking for.</p>
        <motion.button
            className="action-btn primary"
            onClick={onBack}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            Back to Groups
        </motion.button>
    </div>
);
