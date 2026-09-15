import { motion } from 'framer-motion';

/**
 * 7.4 -- split out of NewGroupModal verbatim (behaviour-preserving).
 */
interface NewGroupFooterProps {
    handleNextStep: (...args: unknown[]) => void;
    handlePrevStep: (...args: unknown[]) => void;
    onClose: (...args: unknown[]) => void;
    step: number;
}

const NewGroupFooter = ({
    handleNextStep,
    handlePrevStep,
    onClose,
    step,
}: NewGroupFooterProps) => (
    <div className="modal-footer">
        {step === 1 ? (
            <div className="footer-buttons">
                <motion.button
                    type="button"
                    className="btn btn-secondary"
                    onClick={onClose}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                >
                    Cancel
                </motion.button>
                <motion.button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleNextStep}
                    whileHover={{ y: -2, boxShadow: "0 5px 15px rgba(105, 162, 151, 0.3)" }}
                    whileTap={{ scale: 0.95 }}
                >
                    Next
                </motion.button>
            </div>
        ) : (
            <div className="footer-buttons">
                <motion.button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handlePrevStep}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                >
                    Back
                </motion.button>
                <motion.button
                    type="submit"
                    className="btn btn-primary"
                    whileHover={{ y: -2, boxShadow: "0 5px 15px rgba(105, 162, 151, 0.3)" }}
                    whileTap={{ scale: 0.95 }}
                >
                    Create Group
                </motion.button>
            </div>
        )}
    </div>
);

export default NewGroupFooter;
