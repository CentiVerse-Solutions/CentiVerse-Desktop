use chrono::Utc;
use crate::models::auth::{AuthReq, AuthRes, AuthOutput};
use crate::entities::users::{self, ActiveModel as UserActiveModel};
use crate::custom_errors::auth::AuthError;
use crate::utils::jwt_token::generate_jwt;
use axum::{
    extract::{Json, Extension},
    response::IntoResponse,
    http::StatusCode,
    Json as AxumJson,
};
use sea_orm::{EntityTrait, ActiveModelTrait, Set, QueryFilter, ColumnTrait};
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
    
    let user_model = match existing_user {
        Some(user) => {
            let mut active_user: users::ActiveModel = user.into();
            active_user.updated_at = Set(Utc::now().into());
            active_user
                .update(&db)
                .await
                .map_err(|e| AuthError::DatabaseError(e.to_string()))?
        },
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
            new_user
                .insert(&db)
                .await
                .map_err(|e| AuthError::DatabaseError(e.to_string()))?
        }
    };


    let token = generate_jwt(user_model.id)?;

    let auth_response = AuthOutput {
        token,
        user: AuthRes::from(user_model),
    };

    Ok((StatusCode::OK, AxumJson(auth_response)))
}
