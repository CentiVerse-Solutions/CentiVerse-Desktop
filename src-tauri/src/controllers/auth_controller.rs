use chrono::Utc;
use crate::models::auth::SignupReq;
use crate::entities::users::{self, Entity as UserEntity, ActiveModel as UserActiveModel};
use crate::custom_errors::auth::SignupError;
use axum::{
    extract::{Json, Extension},
    response::IntoResponse,
    http::StatusCode,
    Json as AxumJson,
};
use sea_orm::{EntityTrait, ActiveModelTrait, Set, QueryFilter,ColumnTrait};
use uuid::Uuid;

pub async fn signup_handler(
    Extension(db): Extension<sea_orm::DatabaseConnection>, 
    Json(payload): Json<SignupReq>
) -> Result<impl IntoResponse, SignupError> {
    payload.check()?;

    // This is the corrected way to filter in Sea-ORM
    let existing_user = users::Entity::find()
        .filter(users::Column::Email.eq(payload.email.clone()))
        .one(&db)
        .await
        .map_err(|e| SignupError::DatabaseError(e.to_string()))?;

    if existing_user.is_some() {
        return Err(SignupError::DuplicateError("User with this email already exists".into()));
    }

    let new_user = users::ActiveModel {
        id: Set(Uuid::new_v4()),
        oauth_provider: Set(payload.oauth_provider),
        oauth_id: Set(payload.oauth_id),
        username: Set(payload.username),
        email: Set(payload.email),
        upi_id: Set(payload.upi_id),
        created_at: Set(Utc::now().into()),
        updated_at: Set(Utc::now().into()),
    };

    let inserted_user = new_user
        .insert(&db)
        .await
        .map_err(|e| SignupError::DatabaseError(e.to_string()))?;

    Ok((StatusCode::CREATED, AxumJson(inserted_user)))
}