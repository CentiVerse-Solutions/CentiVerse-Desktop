use axum::{Json, extract::Extension, response::IntoResponse};
use sea_orm::{DatabaseConnection, EntityTrait, Set};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::entities::{users, users::Entity};

#[derive(Debug, Deserialize)]
pub struct SignupRequest {
    pub username: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub name: Option<String>,
    pub password: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct SignupResponse {
    pub message: String,
    pub user_id: String,
}

pub async fn login_handler() -> impl IntoResponse {
    "Login successful"
}

pub async fn signup_handler(
    Extension(db_conn): Extension<DatabaseConnection>,
    Json(payload): Json<SignupRequest>
) -> impl IntoResponse {
    // Generate a new UUID for the user id.
    let user_id = Uuid::new_v4().to_string();

    // Create a new active model for the user.
    let new_user = users::ActiveModel {
        id: Set(user_id.clone()),
        username: Set(payload.username.or(Some("-".to_owned()))),
        email: Set(payload.email.or(Some("-".to_owned()))),
        phone: Set(payload.phone.or(Some("-".to_owned()))),
        name: Set(payload.name.or(Some("-".to_owned()))),
        password: Set(payload.password.or(Some("-".to_owned()))),
        created_at: Set(Some(chrono::Utc::now().naive_utc())),
        updated_at: Set(Some(chrono::Utc::now().naive_utc())),
    };

    // Insert the new user into the database.
    match users::Entity::insert(new_user).exec(&db_conn).await {
        Ok(_result) => {
            let response = SignupResponse {
                message: "Signup successful".to_owned(),
                user_id,
            };
            (axum::http::StatusCode::CREATED, Json(response)).into_response()
        }
        Err(e) => {
            eprintln!("Failed to insert user: {:?}", e);
            (axum::http::StatusCode::INTERNAL_SERVER_ERROR, "Signup failed").into_response()
        }
    }
}
