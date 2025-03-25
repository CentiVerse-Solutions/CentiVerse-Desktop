use axum::{routing::{get, post}, Router, middleware};
use crate::controllers::groups_controller::create_group_handler;
use crate::request_verifier::users::verify_user;

pub fn router() -> Router {
    Router::new()
        .route("/groups/create_group", post(create_group_handler))
        .layer(middleware::from_fn(verify_user))
}
