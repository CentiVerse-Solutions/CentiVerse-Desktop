use chrono::Utc;
use crate::models::groups::{GroupRes,CreateGroupReq};
use crate::entities::groups::{self, ActiveModel};
use crate::custom_errors::app::AppError;
use axum::{
    extract::{Json, Extension},
    response::IntoResponse,
    http::StatusCode,
    Json as AxumJson,
};
use serde_json::json;
use sea_orm::{EntityTrait, ActiveModelTrait, Set, QueryFilter, ColumnTrait};
use uuid::Uuid;


pub async fn create_group_handler(
    Extension(user_id): Extension<Uuid>,
    Extension(db): Extension<sea_orm::DatabaseConnection>, 
    Json(mut payload): Json<CreateGroupReq>
) -> Result<impl IntoResponse, AppError> {
    payload.check()?;

    let new_group = groups::ActiveModel {
        id: Set(Uuid::new_v4()),
        creator_id: Set(user_id),
        group_name: Set(payload.group_name),
        auto_logo: Set(payload.auto_logo),
        total_expense: Set(rust_decimal::Decimal::new(0, 0)),
        created_at: Set(Utc::now().into()),
        updated_at: Set(Utc::now().into()),
    };

    let inserted = new_group
        .insert(&db)
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    Ok((StatusCode::CREATED, AxumJson(GroupRes::from(inserted))))
}

