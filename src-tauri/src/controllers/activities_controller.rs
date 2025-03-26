use chrono::Utc;
use crate::models::activities::{ActivityRes, CreateActivityReq};
use crate::entities::activities::{self};
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
use crate::request_verifier::groups::{check_group_exists,check_user_exists_in_group};

pub async fn create_activity_handler(
    Extension(user_id): Extension<Uuid>,
    Extension(db): Extension<sea_orm::DatabaseConnection>, 
    Json(mut payload): Json<CreateActivityReq>
) -> Result<impl IntoResponse, AppError> {
    // println!("{}",user_id);
    payload.check()?;
    if let Err(err) = check_group_exists(&db, payload.group_id).await {
        return Err(err);
    }
    
    if let Err(err) = check_user_exists_in_group(&db, payload.group_id, user_id).await {
        return Err(err);
    }
    let new_activity = activities::ActiveModel {
        id: Set(Uuid::new_v4()),
        description: Set(payload.description),
        paid_by_id: Set(user_id),
        group_id: Set(payload.group_id),
        time: Set(Utc::now().into()),
        amount: Set(payload.amount),
        split_members: Set(json!(payload.split_members)), 
        split_amounts: Set(json!(payload.split_amounts)),
        user_involvement: Set(payload.split_members.contains(&user_id)),
        expense_logo: Set(payload.expense_logo),
        created_at: Set(Utc::now().into()),
        updated_at: Set(Utc::now().into()),
    };
    
    let inserted = new_activity
        .insert(&db)
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;
    
    Ok((StatusCode::CREATED, AxumJson(ActivityRes::from(inserted))))
}
