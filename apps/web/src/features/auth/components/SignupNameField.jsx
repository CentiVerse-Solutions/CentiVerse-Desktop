/**
 * 7.4 -- split out of AuthModal verbatim (behaviour-preserving).
 */
const SignupNameField = ({
    errors,
    formData,
    handleChange,
}) => (
    <div className="modern-form-group">
        <label htmlFor="name">Full Name</label>
        <div className="modern-input-container">
            <svg className="modern-input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                className={errors.name ? 'error' : ''}
            />
            <div className="input-highlight"></div>
        </div>
        {errors.name && <span className="modern-error-message">{errors.name}</span>}
    </div>
);

export default SignupNameField;
