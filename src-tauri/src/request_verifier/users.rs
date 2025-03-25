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

fn verify_user(){
    let existing_user = users::Entity::find()
    .filter(users::Column::id.eq(payload.id.clone()))
    .one(&db)
    .await
    .map_err(|e| AuthError::DatabaseError(e.to_string()))?;
}