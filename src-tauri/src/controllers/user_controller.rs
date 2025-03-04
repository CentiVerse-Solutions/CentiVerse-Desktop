use axum::response::IntoResponse;
pub async fn get_users_handler() -> impl IntoResponse {
    "Users endpoint"
}