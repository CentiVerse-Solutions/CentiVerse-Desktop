/**
 * 7.4 -- split out of AuthModal verbatim (behaviour-preserving).
 */
const SocialAuthButtons = () => (
    <div className="modern-social-auth">
        <p className="modern-or-divider">
            <span>Or continue with</span>
        </p>
        <div className="modern-social-buttons">
            <button type="button" className="modern-social-button google">
                <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Google</span>
            </button>
            <button type="button" className="modern-social-button facebook">
                <svg width="24" height="24" viewBox="0 0 24 24">
                    <path d="M22.56 12.25C22.56 6.82 18.15 2.42 12.75 2.42C7.34 2.42 2.94 6.83 2.94 12.25C2.94 17.16 6.45 21.22 11.04 22V15.03H8.58V12.25H11.05V10.12C11.05 7.73 12.47 6.42 14.66 6.42C15.71 6.42 16.81 6.59 16.81 6.59V8.95H15.59C14.39 8.95 14.02 9.73 14.02 10.52V12.25H16.69L16.27 15.03H14.01V22C18.6 21.22 22.56 17.16 22.56 12.25Z" fill="#1877F2" />
                </svg>
                <span>Facebook</span>
            </button>
        </div>
    </div>
);

export default SocialAuthButtons;
