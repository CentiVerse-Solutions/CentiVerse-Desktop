use axum::{http::StatusCode, response::{IntoResponse, Response}, Json};
use serde_json::json;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AuthError {
    #[error("Validation failed: {0}")]
    AuthReqValidationError(String),

    #[error("Database error: {0}")]
    DatabaseError(String),

    #[error("Duplicate error: {0}")]
    DuplicateError(String),

    #[error("Internal server error")]
    InternalServerError,
}

impl IntoResponse for AuthError {
    fn into_response(self) -> Response {
        match self {
            AuthError::AuthReqValidationError(err) => {
                let error_json = json!({ "Validation error": err });
                (StatusCode::BAD_REQUEST, Json(error_json)).into_response()
            }
            AuthError::DatabaseError(err) => {
                let error_json = json!({ "Database error": err });
                (StatusCode::INTERNAL_SERVER_ERROR, Json(error_json)).into_response()
            }
            AuthError::DuplicateError(err) => {
                let error_json = json!({ "Duplicate error": err });
                (StatusCode::CONFLICT, Json(error_json)).into_response()
            }
            AuthError::InternalServerError => {
                let error_json = json!({ "Internal server error": "Something went wrong" });
                (StatusCode::INTERNAL_SERVER_ERROR, Json(error_json)).into_response()
            }
        }
    }
}


