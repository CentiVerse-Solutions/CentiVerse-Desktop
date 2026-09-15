import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '../../../components/common/Badge/Badge';
import { Button } from '../../../components/common/Button/Button';
import { Card } from '../../../components/common/Card/Card';

/**
 * 7.4 -- one component per Account section, extracted verbatim.
 * Behaviour-preserving: identical markup and animation variants.
 */
const PaymentMethodsSection = ({
    activeSection,
    handleAddPaymentMethod,
    handleRemovePaymentMethod,
    handleSetDefaultPaymentMethod,
    hoverScale,
    isEditing,
    itemVariants,
    paymentMethods,
    sectionVariants,
}) => (
    <motion.div
        key="payment"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={sectionVariants}
    >
        <Card className={`account-section ${activeSection === 'payment' ? 'section-active' : ''}`}>
            <div className="section-header">
                <motion.h2
                    className="section-title"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    Payment Methods
                </motion.h2>
                {isEditing && (
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Button variant="outlined" size="small" onClick={handleAddPaymentMethod}>
                            <span className="button-icon">+</span>
                            Add Method
                        </Button>
                    </motion.div>
                )}
            </div>
    
            <motion.div
                className="payment-methods-list"
                variants={{
                    animate: {
                        transition: {
                            staggerChildren: 0.1
                        }
                    }
                }}
            >
                <AnimatePresence>
                    {paymentMethods.map((method, index) => (
                        <motion.div
                            key={method.id}
                            className="payment-method-item"
                            variants={itemVariants}
                            custom={index}
                            whileHover={hoverScale}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        >
                            <div className="payment-method-details">
                                <div className="payment-method-type">
                                    <motion.span
                                        className="payment-icon"
                                        whileHover={{ rotate: 10, scale: 1.1 }}
                                    >
                                        {method.type === 'UPI' ? '₹' :
                                            method.type === 'Bank Account' ? '🏦' : '📱'}
                                    </motion.span>
                                    <span className="payment-name">{method.type}</span>
                                    {method.isDefault && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 260,
                                                damping: 20
                                            }}
                                        >
                                            <Badge variant="success">Default</Badge>
                                        </motion.div>
                                    )}
                                </div>
                                <div className="payment-method-info">
                                    <span>{method.details}</span>
                                </div>
                            </div>
                            {isEditing && (
                                <div className="payment-method-actions">
                                    {!method.isDefault && (
                                        <motion.button
                                            className="action-btn set-default"
                                            onClick={() => handleSetDefaultPaymentMethod(method.id)}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            Set as Default
                                        </motion.button>
                                    )}
                                    <motion.button
                                        className="action-btn remove"
                                        onClick={() => handleRemovePaymentMethod(method.id)}
                                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(229, 57, 53, 0.1)' }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Remove
                                    </motion.button>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>
        </Card>
    </motion.div>
);

export default PaymentMethodsSection;
