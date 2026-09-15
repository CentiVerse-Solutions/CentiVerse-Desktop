import { motion } from 'framer-motion';
import { Camera, Check } from 'lucide-react';

/**
 * 7.4 -- one step of the new-group wizard, split out verbatim.
 */
const GroupDetailsStep = ({
    defaultAvatars,
    errors,
    formData,
    handleChange,
    selectedAvatar,
    setSelectedAvatar,
    step,
    stepVariants,
}) => (
    <motion.div
        key="step1"
        className="form-step"
        variants={stepVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
    >
        <div className="form-group">
            <label htmlFor="name">Group Name*</label>
            <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter group name"
                className={errors.name ? 'error' : ''}
            />
            {errors.name && <div className="error-message">{errors.name}</div>}
        </div>
    
        <div className="form-group">
            <label htmlFor="description">Description (optional)</label>
            <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="What is this group for?"
                rows="3"
            ></textarea>
        </div>
    
        <div className="form-group">
            <label htmlFor="currency">Currency</label>
            <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
            >
                <option value="USD">US Dollar ($)</option>
                <option value="EUR">Euro (€)</option>
                <option value="GBP">British Pound (£)</option>
                <option value="INR">Indian Rupee (₹)</option>
                <option value="CAD">Canadian Dollar (CA$)</option>
                <option value="AUD">Australian Dollar (A$)</option>
                <option value="JPY">Japanese Yen (¥)</option>
            </select>
        </div>
    
        <div className="form-group">
            <label>Group Avatar*</label>
            <div className="avatar-grid">
                {defaultAvatars.map((avatar, index) => (
                    <motion.div
                        key={index}
                        className={`avatar-option ${selectedAvatar === avatar ? 'selected' : ''}`}
                        onClick={() => setSelectedAvatar(avatar)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <img src={avatar} alt={`Avatar option ${index + 1}`} />
                        {selectedAvatar === avatar && (
                            <div className="avatar-selected-check">
                                <Check size={16} />
                            </div>
                        )}
                    </motion.div>
                ))}
                <motion.div
                    className="avatar-option upload"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <div className="upload-icon">
                        <Camera size={24} />
                    </div>
                    <span>Upload</span>
                </motion.div>
            </div>
            {errors.avatar && <div className="error-message">{errors.avatar}</div>}
        </div>
    </motion.div>
);

export default GroupDetailsStep;
