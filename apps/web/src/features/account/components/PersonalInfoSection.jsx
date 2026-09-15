import { motion } from 'framer-motion';
import { Button } from '../../../components/common/Button/Button';
import { Card } from '../../../components/common/Card/Card';

/**
 * 7.4 -- one component per Account section, extracted verbatim.
 * Behaviour-preserving: identical markup and animation variants.
 */
const PersonalInfoSection = ({
    activeSection,
    handleDeleteAccount,
    handleExportData,
    handleInputChange,
    isEditing,
    itemVariants,
    profileData,
    sectionVariants,
}) => (
    <motion.div
        key="personal"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={sectionVariants}
    >
        <Card className={`account-section ${activeSection === 'personal' ? 'section-active' : ''}`}>
            <motion.h2
                className="section-title"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
            >
                Personal Information
            </motion.h2>
            <motion.div className="form-grid">
                {[
                    { id: 'name', label: 'Full Name', type: 'text', value: profileData.name },
                    { id: 'email', label: 'Email Address', type: 'email', value: profileData.email },
                    { id: 'phone', label: 'Phone Number', type: 'tel', value: profileData.phone },
                    { id: 'upiId', label: 'UPI ID', type: 'text', value: profileData.upiId }
                ].map((field, index) => (
                    <motion.div
                        className="form-group"
                        key={field.id}
                        variants={itemVariants}
                        custom={index}
                        whileHover={isEditing ? { y: -4 } : {}}
                    >
                        <label htmlFor={field.id}>{field.label}</label>
                        <motion.input
                            type={field.type}
                            id={field.id}
                            name={field.id}
                            value={field.value}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className={isEditing ? 'editable' : ''}
                            animate={isEditing ? {
                                boxShadow: ['0 2px 4px rgba(0, 0, 0, 0.05)', '0 4px 8px rgba(105, 162, 151, 0.15)', '0 2px 4px rgba(0, 0, 0, 0.05)'],
                            } : {}}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatType: 'reverse'
                            }}
                        />
                    </motion.div>
                ))}
            </motion.div>
        </Card>
    
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
        >
            <Card className="account-section">
                <motion.h2
                    className="section-title"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                >
                    Account Actions
                </motion.h2>
                <div className="account-actions">
                    <motion.div
                        className="action-group"
                        variants={itemVariants}
                        custom={0}
                    >
                        <h3>Data Management</h3>
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                            <Button variant="outlined" onClick={handleExportData}>
                                <motion.span
                                    className="button-icon"
                                    animate={{ y: [0, -3, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                    📤
                                </motion.span>
                                <span>Export my data</span>
                            </Button>
                        </motion.div>
                    </motion.div>
                    <motion.div
                        className="action-group"
                        variants={itemVariants}
                        custom={1}
                    >
                        <h3>Danger Zone</h3>
                        <motion.div
                            whileHover={{
                                scale: 1.03,
                                transition: { duration: 0.2 }
                            }}
                            whileTap={{ scale: 0.97 }}
                        >
                            <Button variant="danger" onClick={handleDeleteAccount}>
                                <motion.span
                                    className="button-icon"
                                    animate={{ rotate: [0, 10, 0, -10, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    🗑️
                                </motion.span>
                                <span>Delete my account</span>
                            </Button>
                        </motion.div>
                    </motion.div>
                </div>
            </Card>
        </motion.div>
    </motion.div>
);

export default PersonalInfoSection;
