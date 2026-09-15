import { motion } from 'framer-motion';
import { Button } from '../../../components/common/Button/Button';
import { Card } from '../../../components/common/Card/Card';

/**
 * 7.4 -- one component per Account section, extracted verbatim.
 * Behaviour-preserving: identical markup and animation variants.
 */
const SecuritySection = ({
    activeSection,
    formatDate,
    isEditing,
    sectionVariants,
    securitySettings,
    setSecuritySettings,
}) => (
    <motion.div
        key="security"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={sectionVariants}
    >
        <Card className={`account-section ${activeSection === 'security' ? 'section-active' : ''}`}>
            <motion.h2
                className="section-title"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
            >
                Security Settings
            </motion.h2>
    
            <div className="security-container">
                <div className="security-item">
                    <div className="security-info">
                        <h3>Password</h3>
                        <p>Last changed: {formatDate(securitySettings.passwordLastChanged)}</p>
                    </div>
                    <Button variant="outlined" size="small">
                        Change Password
                    </Button>
                </div>
    
                <div className="security-item">
                    <div className="security-info">
                        <h3>Two-Factor Authentication</h3>
                        <p>Adds an extra layer of security to your account</p>
                    </div>
                    <div className="toggle-switch">
                        <input
                            type="checkbox"
                            id="twoFactorAuth"
                            checked={securitySettings.twoFactorAuth}
                            onChange={() => setSecuritySettings({
                                ...securitySettings,
                                twoFactorAuth: !securitySettings.twoFactorAuth
                            })}
                            disabled={!isEditing}
                        />
                        <label htmlFor="twoFactorAuth" className="toggle-label"></label>
                    </div>
                </div>
    
                <div className="security-item">
                    <div className="security-info">
                        <h3>Login Notifications</h3>
                        <p>Get notified when someone logs into your account</p>
                    </div>
                    <div className="toggle-switch">
                        <input
                            type="checkbox"
                            id="loginNotifications"
                            checked={securitySettings.loginNotifications}
                            onChange={() => setSecuritySettings({
                                ...securitySettings,
                                loginNotifications: !securitySettings.loginNotifications
                            })}
                            disabled={!isEditing}
                        />
                        <label htmlFor="loginNotifications" className="toggle-label"></label>
                    </div>
                </div>
    
                <div className="security-item">
                    <div className="security-info">
                        <h3>Active Sessions</h3>
                        <p>Manage devices where you're currently logged in</p>
                    </div>
                    <Button variant="outlined" size="small">
                        View Sessions
                    </Button>
                </div>
            </div>
        </Card>
    </motion.div>
);

export default SecuritySection;
