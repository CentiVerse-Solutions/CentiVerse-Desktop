use axum::{middleware, routing::{delete, get, post}, Router};
use crate::controllers::group_members_controller::{add_member_to_group,remove_group_member};
use crate::request_verifier::users::verify_user;

pub fn router() -> Router {
    Router::new()
        .route("/group_members/add_member", post(add_member_to_group))
        .route("/group_members/remove_member", delete(remove_group_member))
        .layer(middleware::from_fn(verify_user))
}
