/**
 * 7.4 -- split out of AuthModal verbatim (behaviour-preserving).
 */
const AuthHeader = ({
    mode,
}) => (
    <div className="modern-auth-header">
        <div className="logo-container">
            <div className="logo-circle">
                <span>CV</span>
            </div>
        </div>
        <h2 className="modern-auth-title">{mode === 'login' ? 'Welcome Back' : 'Join CentiVerse'}</h2>
        <p className="modern-auth-subtitle">
            {mode === 'login'
                ? 'Sign in to continue your journey'
                : 'Create an account to start managing expenses'}
        </p>
    </div>
);

export default AuthHeader;
