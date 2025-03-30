use axum::{routing::{get, post}, Router, middleware};
use crate::controllers::group_members_controller::{add_member_to_group};
use crate::request_verifier::users::verify_user;

pub fn router() -> Router {
    Router::new()
        .route("/group_members/add_member", post(add_member_to_group))
        .layer(middleware::from_fn(verify_user))
}
