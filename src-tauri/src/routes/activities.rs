use axum::{routing::{get, post,patch,delete}, Router, middleware};
use crate::controllers::activities_controller::{create_activity_handler,update_activity_handler,delete_activity_handler};
use crate::request_verifier::{users::verify_user};
pub fn router() -> Router {
    Router::new()
        .route("/activities/create_activities", post(create_activity_handler))
        .route("/activities/update_activities", patch(update_activity_handler))
        .route("/activities/delete_activities", delete(delete_activity_handler))
        .layer(middleware::from_fn(verify_user))
}
