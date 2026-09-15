import { motion } from 'framer-motion';
import { Card } from '../../../components/common/Card/Card';
import { SUPPORTED_CURRENCIES as mockCurrencies } from '../../../shared/currencies';

/**
 * 7.4 -- one component per Account section, extracted verbatim.
 * Behaviour-preserving: identical markup and animation variants.
 */
const PreferencesSection = ({
    activeSection,
    handleInputChange,
    handleToggleDarkMode,
    isEditing,
    itemVariants,
    profileData,
    sectionVariants,
}) => (
    <motion.div
        key="preferences"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={sectionVariants}
    >
        <Card className={`account-section ${activeSection === 'preferences' ? 'section-active' : ''}`}>
            <motion.h2
                className="section-title"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
            >
                Preferences
            </motion.h2>
            <div className="form-grid">
                <div className="form-group">
                    <label htmlFor="currency">Default Currency</label>
                    <select
                        id="currency"
                        name="currency"
                        value={profileData.currency}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={isEditing ? 'editable' : ''}
                    >
                        {mockCurrencies.map(currency => (
                            <option key={currency.code} value={currency.code}>
                                {currency.name} ({currency.symbol})
                            </option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="language">Language</label>
                    <select
                        id="language"
                        name="language"
                        value={profileData.language}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={isEditing ? 'editable' : ''}
                    >
                        <option value="English">English</option>
                        <option value="Hindi">Hindi</option>
                        <option value="Spanish">Spanish</option>
                        <option value="French">French</option>
                        <option value="German">German</option>
                        <option value="Japanese">Japanese</option>
                        <option value="Chinese">Chinese</option>
                    </select>
                </div>
                <div className="form-group toggle-group">
                    <label htmlFor="darkMode">Dark Mode</label>
                    <div className="toggle-switch">
                        <input
                            type="checkbox"
                            id="darkMode"
                            checked={profileData.darkMode}
                            onChange={handleToggleDarkMode}
                            disabled={!isEditing}
                        />
                        <label htmlFor="darkMode" className="toggle-label"></label>
                    </div>
                </div>
            </div>
    
            <div className="preference-categories">
                <h3 className="subsection-title">Default Categories</h3>
                <p className="subsection-description">
                    Select your most used expense categories to appear at the top when adding expenses.
                </p>
                <motion.div
                    className="category-chips"
                    variants={{
                        animate: {
                            transition: {
                                staggerChildren: 0.1
                            }
                        }
                    }}
                >
                    {[
                        { icon: '🍔', name: 'Food & Drink', selected: true },
                        { icon: '🚕', name: 'Transportation', selected: true },
                        { icon: '🏨', name: 'Accommodation', selected: false },
                        { icon: '🛒', name: 'Groceries', selected: true },
                        { icon: '🎬', name: 'Entertainment', selected: false },
                        { icon: '💡', name: 'Utilities', selected: false }
                    ].map((category, index) => (
                        <motion.div
                            key={category.name}
                            className={`category-chip ${category.selected ? 'selected' : ''}`}
                            variants={itemVariants}
                            custom={index}
                            whileHover={{
                                scale: 1.05,
                                y: -5,
                                boxShadow: '0 6px 10px rgba(0, 0, 0, 0.1)'
                            }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <span className="category-icon">{category.icon}</span>
                            <span>{category.name}</span>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </Card>
    </motion.div>
);

export default PreferencesSection;
