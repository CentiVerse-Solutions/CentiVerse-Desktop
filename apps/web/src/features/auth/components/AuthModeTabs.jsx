/**
 * 7.4 -- split out of AuthModal verbatim (behaviour-preserving).
 */
const AuthModeTabs = ({
    mode,
    switchMode,
}) => (
    <div className="modern-auth-tabs">
        <button
            type="button"
            className={`modern-auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => switchMode('login')}
        >
            Log In
        </button>
        <button
            type="button"
            className={`modern-auth-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => switchMode('signup')}
        >
            Sign Up
        </button>
        <div
            className="modern-tab-indicator"
            style={{
                left: mode === 'login' ? '0%' : '50%',
                width: '50%'
            }}
        ></div>
    </div>
);

export default AuthModeTabs;
