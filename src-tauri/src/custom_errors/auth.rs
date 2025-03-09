use axum::{http::StatusCode, response::{IntoResponse, Response}, Json};
use serde_json::json;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum SignupError {
    #[error("Validation failed: {0}")]
    SignupReqValidationError(String),

    #[error("Database error: {0}")]
    DatabaseError(String),

    #[error("Internal server error")]
    InternalServerError,
}

impl IntoResponse for SignupError {
    fn into_response(self) -> Response {
        match self {
            SignupError::SignupReqValidationError(err) => {
                let error_json = json!({ "Validation error": err });
                (StatusCode::BAD_REQUEST, Json(error_json)).into_response()
            }
            SignupError::DatabaseError(err) => {
                let error_json = json!({ "Database error": err });
                (StatusCode::INTERNAL_SERVER_ERROR, Json(error_json)).into_response()
            }
            SignupError::InternalServerError => {
                let error_json = json!({ "Internal server error": "Something went wrong" });
                (StatusCode::INTERNAL_SERVER_ERROR, Json(error_json)).into_response()
            }
        }
    }
}


