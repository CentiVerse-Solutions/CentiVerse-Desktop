use axum::routing::get;
use axum::Router;
use crate::controllers::expense_controller::get_expenses_handler;

pub fn router() -> Router {
    Router::new()
        .route("/expenses/get_expenses", get(get_expenses_handler))
}
