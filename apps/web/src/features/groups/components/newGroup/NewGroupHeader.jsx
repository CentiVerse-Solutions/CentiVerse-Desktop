import { motion } from 'framer-motion';
import { Users, X } from 'lucide-react';

/**
 * 7.4 -- split out of NewGroupModal verbatim (behaviour-preserving).
 */
const NewGroupHeader = ({
    onClose,
    step,
}) => (
    <div className="modal-header">
        <h2 id="new-group-title" className="modal-title">
            <Users className="modal-title-icon" size={20} />
            {step === 1 ? 'Create New Group' : 'Add Group Members'}
        </h2>
        <motion.button
            className="modal-close-btn"
            onClick={onClose}
            whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.06)" }}
            whileTap={{ scale: 0.92 }}
        >
            <X size={20} />
        </motion.button>
    </div>
);

export default NewGroupHeader;
