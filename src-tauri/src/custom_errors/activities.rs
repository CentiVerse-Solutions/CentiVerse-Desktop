use axum::{http::StatusCode, response::{IntoResponse, Response}, Json};
use serde_json::json;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ActivityError {
    #[error("Validation failed: {0}")]
    ActivityReqValidationError(String),

    #[error("Database error: {0}")]
    DatabaseError(String),

    #[error("Amounts Don't Add up:{0}")]
    AmountsDontAddUp(String),

    #[error("Internal server error")]
    InternalServerError,
}

impl IntoResponse for ActivityError {
    fn into_response(self) -> Response {
        match self {
            ActivityError::ActivityReqValidationError(err) => {
                let error_json = json!({ "Validation error": err });
                (StatusCode::BAD_REQUEST, Json(error_json)).into_response()
            }
            ActivityError::DatabaseError(err) => {
                let error_json = json!({ "Amounts Don't Add up error": err });
                (StatusCode::INTERNAL_SERVER_ERROR, Json(error_json)).into_response()
            }
            ActivityError::AmountsDontAddUp(err) => {
                let error_json = json!({ "Database error": err });
                (StatusCode::INTERNAL_SERVER_ERROR, Json(error_json)).into_response()
            }
            ActivityError::InternalServerError => {
                let error_json = json!({ "Internal server error": "Something went wrong" });
                (StatusCode::INTERNAL_SERVER_ERROR, Json(error_json)).into_response()
            }
        }
    }
}


