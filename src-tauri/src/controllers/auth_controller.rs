// src/controllers/auth_controller.rs

use axum::response::IntoResponse;


pub async fn login_handler() -> impl IntoResponse {
    "Login successful"
}
