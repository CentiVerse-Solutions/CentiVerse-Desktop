// src/routes/users.rs

use axum::routing::get;
use axum::Router;
use crate::controllers::user_controller::get_users_handler;

pub fn router() -> Router {
    Router::new().route("/users/get_users", get(get_users_handler))
}
