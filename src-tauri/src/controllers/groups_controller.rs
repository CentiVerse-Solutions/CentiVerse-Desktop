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
use dotenv::dotenv;
use std::env;
use serde_json::json;
use sea_orm::{EntityTrait, ActiveModelTrait, Set, QueryFilter, ColumnTrait, query::* , entity::*};
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

pub async fn get_all_groups_handler(
    Extension(user_id): Extension<Uuid>,
    Extension(db): Extension<sea_orm::DatabaseConnection>,
) -> Result<impl IntoResponse, AppError> {
    // Retrieve PAGE_SIZE from environment variables and parse it safely
    let page_size: u64 = env::var("PAGE_SIZE")
        .map_err(|_| AppError::ConfigError("PAGE_SIZE must be set".to_string()))?
        .trim()
        .parse()
        .map_err(|_| AppError::ConfigError("Invalid PAGE_SIZE value".to_string()))?;

   
    let paginator = groups::Entity::find()
        .filter(groups::Column::CreatorId.eq(user_id))
        .paginate(&db, page_size);

    let mut all_groups = Vec::new();
    let mut page_stream = paginator;

    while let Some(groups_page) = page_stream
        .fetch_and_next()
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))? 
    {
        all_groups.extend(groups_page);
    }

    Ok((StatusCode::OK, AxumJson(all_groups)))
}

