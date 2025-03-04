
use axum::Router;

mod auth;
mod users;
mod expenses;

pub fn app_routes() -> Router {
    Router::new()
        .merge(users::router())
        .merge(auth::router())
        .merge(expenses::router())
}
