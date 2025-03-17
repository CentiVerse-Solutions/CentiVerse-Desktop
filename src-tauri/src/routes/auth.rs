use axum::routing::{get, post};
use axum::Router;
use crate::controllers::auth_controller::{auth_handler};

/// Constructs the auth routes.
pub fn router() -> Router {
    Router::new()
    .route("/auth/signup", post(auth_handler))
    // .route("/auth/login", get(login_handler))
}
