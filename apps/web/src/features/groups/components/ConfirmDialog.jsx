import { motion } from 'framer-motion';
import { Info } from 'lucide-react';

/**
 * 7.4 -- extracted from GroupDetails verbatim (behaviour-preserving).
 */
const ConfirmDialog = ({
    group,
    memberToRemove,
    handleConfirmAction,
    handleCancelConfirm,
}) => (
    <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
    >
        <motion.div
            className="modal-content confirm-dialog"
            style={{ maxWidth: "400px" }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            role="alertdialog"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-desc"
        >
            <div className="modal-header">
                <h2 id="confirm-dialog-title">
                    <Info size={18} className="modal-title-icon warning" />
                    Confirm Action
                </h2>
            </div>
            <div className="modal-body">
                <p id="confirm-dialog-desc">
                    {memberToRemove
                        ? `Are you sure you want to remove ${memberToRemove.name} from the group?`
                        : 'Are you sure you want to perform this action?'
                    }
                </p>
                {memberToRemove && (
                    <div className="confirm-member-details">
                        <div className="confirm-member-avatar">
                            <img src={memberToRemove.avatar} alt={memberToRemove.name} />
                        </div>
                        <div className="confirm-member-info">
                            <span className="confirm-member-name">{memberToRemove.name}</span>
                            <span className="confirm-member-email">{memberToRemove.email}</span>
                        </div>
                    </div>
                )}
                <div className="confirm-warning">
                    <p>This action cannot be undone.</p>
                </div>
            </div>
            <div className="modal-footer">
                <motion.button
                    className="cancel-btn"
                    onClick={handleCancelConfirm}
                    whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.05)" }}
                    whileTap={{ scale: 0.95 }}
                >
                    Cancel
                </motion.button>
                <motion.button
                    className="save-btn danger"
                    onClick={handleConfirmAction}
                    whileHover={{ y: -3, boxShadow: "0 6px 20px rgba(229, 62, 62, 0.3)" }}
                    whileTap={{ scale: 0.95 }}
                >
                    Confirm
                </motion.button>
            </div>
        </motion.div>
    </motion.div>
);

export default ConfirmDialog;
