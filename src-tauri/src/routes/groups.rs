use axum::{routing::{get, post}, Router, middleware};
use crate::controllers::groups_controller::{create_group_handler,get_all_groups_handler};
use crate::request_verifier::users::verify_user;

pub fn router() -> Router {
    Router::new()
        .route("/groups/create_group", post(create_group_handler))
        .route("/groups/get_groups",get(get_all_groups_handler))
        .layer(middleware::from_fn(verify_user))
}
