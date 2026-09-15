import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, X } from 'lucide-react';

/**
 * 7.4 -- the add-friend form body, split out of AddFriendModal verbatim.
 */
const AddFriendForm = ({
    activeTab,
    email,
    error,
    handleSubmit,
    name,
    onClose,
    phone,
    setActiveTab,
    setEmail,
    setName,
    setPhone,
}) => (
    <>
        <div className="fr-modal-header">
            <h2 className="fr-modal-title">Add a Friend</h2>
            <motion.button
                className="fr-close-btn"
                onClick={onClose}
                whileHover={{ backgroundColor: "rgba(0,0,0,0.05)", scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                <X size={20} />
            </motion.button>
        </div>
    
        <div className="fr-add-friend-tabs">
            {['email', 'phone'].map((tab) => {
                const Icon = tab === 'email' ? Mail : Phone;
                return (
                    <motion.button
                        key={tab}
                        className={`fr-tab-btn ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                        whileHover={{ backgroundColor: "rgba(0,0,0,0.03)" }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Icon size={16} />
                        <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                        {activeTab === tab && (
                            <motion.div
                                className="fr-active-tab-indicator"
                                layoutId="activeTabIndicator"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}
                    </motion.button>
                );
            })}
        </div>
    
        <div className="fr-add-friend-content">
            <AnimatePresence mode="wait">
                {activeTab === 'email' && (
                    <motion.form
                        key="email"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        onSubmit={handleSubmit}
                        className="fr-email-tab"
                    >
                        <div className="fr-form-group">
                            <label htmlFor="name">Name</label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Friend's name"
                                required
                            />
                        </div>
    
                        <div className="fr-form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="friend@example.com"
                                required
                            />
                        </div>
    
                        {error && (
                            <motion.p
                                className="fr-error-message"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            >
                                {error}
                            </motion.p>
                        )}
    
                        <div className="fr-modal-footer">
                            <motion.button
                                type="button"
                                className="fr-cancel-btn"
                                onClick={onClose}
                                whileHover={{ backgroundColor: "rgba(0,0,0,0.05)", scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Cancel
                            </motion.button>
                            <motion.button
                                type="submit"
                                className="fr-submit-btn"
                                whileHover={{
                                    backgroundColor: "var(--teal-dark)",
                                    scale: 1.02,
                                    boxShadow: "0 5px 15px rgba(105, 162, 151, 0.3)"
                                }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Add Friend
                            </motion.button>
                        </div>
                    </motion.form>
                )}
    
                {activeTab === 'phone' && (
                    <motion.form
                        key="phone"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        onSubmit={handleSubmit}
                        className="fr-phone-tab"
                    >
                        <div className="fr-form-group">
                            <label htmlFor="name-phone">Name</label>
                            <input
                                id="name-phone"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Friend's name"
                                required
                            />
                        </div>
    
                        <div className="fr-form-group">
                            <label htmlFor="phone">Phone Number</label>
                            <input
                                id="phone"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="(555) 123-4567"
                                required
                            />
                        </div>
    
                        {error && (
                            <motion.p
                                className="fr-error-message"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            >
                                {error}
                            </motion.p>
                        )}
    
                        <div className="fr-modal-footer">
                            <motion.button
                                type="button"
                                className="fr-cancel-btn"
                                onClick={onClose}
                                whileHover={{ backgroundColor: "rgba(0,0,0,0.05)", scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Cancel
                            </motion.button>
                            <motion.button
                                type="submit"
                                className="fr-submit-btn"
                                whileHover={{
                                    backgroundColor: "var(--teal-dark)",
                                    scale: 1.02,
                                    boxShadow: "0 5px 15px rgba(105, 162, 151, 0.3)"
                                }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Add Friend
                            </motion.button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>
        </div>
    </>
);

export default AddFriendForm;
