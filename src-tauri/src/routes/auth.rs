use axum::routing::{get, post};
use axum::Router;
use crate::controllers::auth_controller::{signup_handler};

/// Constructs the auth routes.
pub fn router() -> Router {
    Router::new()
    .route("/auth/signup", post(signup_handler))
    // .route("/auth/login", get(login_handler))
}
