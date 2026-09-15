import { motion } from 'framer-motion';
import { Button } from '../../../components/common/Button/Button';
import { Card } from '../../../components/common/Card/Card';

/**
 * 7.4 -- one component per Account section, extracted verbatim.
 * Behaviour-preserving: identical markup and animation variants.
 */
const SupportSection = ({
    activeSection,
    itemVariants,
    sectionVariants,
}) => (
    <motion.div
        key="support"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={sectionVariants}
    >
        <Card className={`account-section ${activeSection === 'support' ? 'section-active' : ''}`}>
            <motion.h2
                className="section-title"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
            >
                Help & Support
            </motion.h2>
    
            <motion.div
                className="support-container"
                variants={{
                    animate: {
                        transition: {
                            staggerChildren: 0.1,
                            delayChildren: 0.2
                        }
                    }
                }}
            >
                {[
                    { icon: '📘', title: 'Knowledge Base', description: 'Browse our articles to learn more about using CentiVerse', action: 'View Articles' },
                    { icon: '🎯', title: 'Feature Requests', description: 'Suggest new features or improvements to our platform', action: 'Submit Request' },
                    { icon: '🐞', title: 'Report a Bug', description: 'Let us know if something isn\'t working as expected', action: 'Report Bug' },
                    { icon: '📞', title: 'Contact Support', description: 'Get in touch with our customer support team', action: 'Contact Us' }
                ].map((card, index) => (
                    <motion.div
                        className="support-card"
                        key={card.title}
                        variants={itemVariants}
                        custom={index}
                        whileHover={{
                            y: -10,
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                        }}
                    >
                        <motion.div
                            className="support-icon"
                            animate={{
                                rotate: [0, 10, 0, -10, 0],
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: 5,
                                repeatDelay: 2
                            }}
                        >
                            {card.icon}
                        </motion.div>
                        <h3>{card.title}</h3>
                        <p>{card.description}</p>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button variant="outlined">{card.action}</Button>
                        </motion.div>
                    </motion.div>
                ))}
            </motion.div>
        </Card>
    </motion.div>
);

export default SupportSection;
