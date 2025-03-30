use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Validation failed: {0}")]
    ValidationError(String),
    
    #[error("Database error: {0}")]
    DatabaseError(String),

    #[error("Database error: {0}")]
    ConfigError(String),

    #[error("Duplicate error: {0}")]
    DuplicateError(String),
    
    #[error("Amounts Don't Add Up: {0}")]
    AmountsDontAddUp(String),
    
    #[error("Resource Not Found: {0}")]
    NotFound(String),
    
    #[error("User Not in Group: {0}")]
    UserNotInGroup(String),
    
    #[error("Unauthorized access: {0}")]
    Unauthorized(String),
    
    #[error("Internal server error")]
    InternalServerError,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            AppError::ValidationError(err) => (StatusCode::BAD_REQUEST, json!({ "Validation error": err })),
            AppError::DatabaseError(err) => (StatusCode::INTERNAL_SERVER_ERROR, json!({ "Database error": err })),
            AppError::ConfigError(err) => (StatusCode::INTERNAL_SERVER_ERROR, json!({ "Config error": err })),
            AppError::DuplicateError(err) => (StatusCode::CONFLICT, json!({ "Duplicate error": err })),
            AppError::AmountsDontAddUp(err) => (StatusCode::BAD_REQUEST, json!({ "Amounts Don't Add Up": err })),
            AppError::NotFound(err) => (StatusCode::NOT_FOUND, json!({ "Not Found": err })),
            AppError::UserNotInGroup(err) => (StatusCode::FORBIDDEN, json!({ "User Not in Group": err })),
            AppError::Unauthorized(err) => (StatusCode::UNAUTHORIZED, json!({ "Unauthorized": err })),
            AppError::InternalServerError => (StatusCode::INTERNAL_SERVER_ERROR, json!({ "Internal server error": "Something went wrong" })),
        };
        (status, Json(error_message)).into_response()
    }
}
