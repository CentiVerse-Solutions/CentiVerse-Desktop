
use axum::Router;

mod auth;
mod users;
mod activities;
mod groups;
pub fn app_routes() -> Router {
    Router::new()
        .merge(users::router())
        .merge(auth::router())
        .merge(activities::router())
        .merge(groups::router())
}
