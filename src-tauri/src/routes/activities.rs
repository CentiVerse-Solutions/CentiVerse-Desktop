use axum::routing::{get,post};
use axum::Router;
use crate::controllers::activities_controller::create_activities_handler;

pub fn router() -> Router {
    Router::new()
        .route("/activities/create_activities", post(create_activities_handler))
}
