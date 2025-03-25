use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum GroupError {
    #[error("Validation failed: {0}")]
    AuthReqValidationError(String),

    #[error("Database error: {0}")]
    DatabaseError(String),

    #[error("Group Not Found: {0}")]
    GroupNotFound(String),

    #[error("Unauthorized access: {0}")]
    Unauthorized(String),

    #[error("Internal server error")]
    InternalServerError,
}

impl IntoResponse for GroupError {
    fn into_response(self) -> Response {
        match self {
            GroupError::AuthReqValidationError(err) => {
                let error_json = json!({ "Validation error": err });
                (StatusCode::BAD_REQUEST, Json(error_json)).into_response()
            }
            GroupError::DatabaseError(err) => {
                let error_json = json!({ "Database error": err });
                (StatusCode::INTERNAL_SERVER_ERROR, Json(error_json)).into_response()
            }
            GroupError::GroupNotFound(err) => {
                let error_json = json!({ "Group Not Found error": err });
                (StatusCode::NOT_FOUND, Json(error_json)).into_response()
            }
            GroupError::Unauthorized(err) => {
                let error_json = json!({ "Unauthorized": err });
                (StatusCode::UNAUTHORIZED, Json(error_json)).into_response()
            }
            GroupError::InternalServerError => {
                let error_json = json!({ "Internal server error": "Something went wrong" });
                (StatusCode::INTERNAL_SERVER_ERROR, Json(error_json)).into_response()
            }
        }
    }
}
