use chrono::Utc;
use crate::models::auth::{SignupReq};
use crate::entities::users::{self, Entity as UserEntity, ActiveModel as UserActiveModel};
use crate::custom_errors::auth::SignupError;
use axum::{extract::{Json, Extension}, response::IntoResponse, http::StatusCode};
use sea_orm::{ActiveModelTrait, Set, DatabaseConnection};
use uuid::Uuid;

pub async fn signup_handler(
    Extension(db): Extension<DatabaseConnection>, 
    Json(payload): Json<SignupReq>
) -> Result<impl IntoResponse, SignupError> {
    payload.check()?;

    let new_user = UserActiveModel {
        id: Set(Uuid::new_v4()), 
        oauth_provider: Set(payload.oauth_provider),
        oauth_id: Set(payload.oauth_id),
        username: Set(payload.username),
        email: Set(payload.email),
        upi_id: Set(payload.upi_id),
        created_at: Set(Utc::now().into()), 
        updated_at: Set(Utc::now().into()),
    };

    let inserted_user: users::Model = new_user.insert(&db).await.map_err(|_| SignupError::DatabaseError("Failed to insert user".into()))?;

    Ok((StatusCode::CREATED, Json(inserted_user)))
}
