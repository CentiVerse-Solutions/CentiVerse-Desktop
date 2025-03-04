// src/routes/auth.rs

use axum::routing::get;
use axum::Router;
use crate::controllers::auth_controller::login_handler;

/// Constructs the auth routes.
pub fn router() -> Router {
    Router::new().route("/auth/login", get(login_handler))
}
