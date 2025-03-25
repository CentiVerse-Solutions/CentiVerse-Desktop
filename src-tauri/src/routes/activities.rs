use axum::{routing::{get, post}, Router, middleware};
use crate::controllers::activities_controller::create_activity_handler;
use crate::request_verifier::users::verify_user;

pub fn router() -> Router {
    Router::new()
        .route("/activities/create_activities", post(create_activity_handler))
        .layer(middleware::from_fn(verify_user))
}
