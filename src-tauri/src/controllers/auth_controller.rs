use chrono::Utc;
use crate::models::auth::{AuthReq, AuthRes};
use crate::entities::users::{self, ActiveModel as UserActiveModel};
use crate::custom_errors::auth::AuthError;
use axum::{
    extract::{Json, Extension},
    response::IntoResponse,
    http::StatusCode,
    Json as AxumJson,
};
use sea_orm::{EntityTrait, ActiveModelTrait, Set, QueryFilter , ColumnTrait};
use uuid::Uuid;

pub async fn auth_handler(
    Extension(db): Extension<sea_orm::DatabaseConnection>, 
    Json(payload): Json<AuthReq>
) -> Result<impl IntoResponse, AuthError> {
    payload.check()?;

    let existing_user = users::Entity::find()
        .filter(users::Column::Email.eq(payload.email.clone()))
        .one(&db)
        .await
        .map_err(|e| AuthError::DatabaseError(e.to_string()))?;
    
    let inserted_user = match existing_user {
        Some(user) => {
            AuthRes::from(user)
        }
        None => {
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
            
            let inserted = new_user
                .insert(&db)
                .await
                .map_err(|e| AuthError::DatabaseError(e.to_string()))?;
            
            AuthRes::from(inserted)
        }
    };

    Ok((StatusCode::CREATED, AxumJson(inserted_user)))
}
