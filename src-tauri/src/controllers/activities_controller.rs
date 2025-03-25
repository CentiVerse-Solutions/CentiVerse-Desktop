use chrono::Utc;
use crate::models::activities::{ActivityRes, CreateActivityReq};
use crate::entities::activities::{self, ActiveModel as ActivityActiveModel};
use crate::custom_errors::activities::ActivityError;
use axum::{
    extract::{Json, Extension},
    response::IntoResponse,
    http::StatusCode,
    Json as AxumJson,
};
use sea_orm::{EntityTrait, ActiveModelTrait, Set, QueryFilter, ColumnTrait};
use uuid::Uuid;

pub async fn create_activity_handler(
    Extension(user_id): Extension<Uuid>,
    Extension(db): Extension<sea_orm::DatabaseConnection>, 
    Json(mut payload): Json<CreateActivityReq>
) -> Result<impl IntoResponse, ActivityError> {
    // println!("{}",user_id);
    payload.check()?;
    
    let new_activity = activities::ActiveModel {
        id: Set(Uuid::new_v4()),
        description: Set(payload.description),
        paid_by_id: Set(user_id),
        group_id: Set(payload.group_id),
        time: Set(Utc::now().into()),
        amount: Set(payload.amount),
        split_members: Set(payload.split_members.clone()),
        split_amounts: Set(payload.split_amounts.clone()),
        user_involvement: Set(payload.split_members.contains(&user_id)),
        expense_logo: Set(payload.expense_logo),
        created_at: Set(Utc::now().into()),
        updated_at: Set(Utc::now().into()),
    };
    
    let inserted = new_activity
        .insert(&db)
        .await
        .map_err(|e| ActivityError::DatabaseError(e.to_string()))?;
    
    Ok((StatusCode::CREATED, AxumJson(ActivityRes::from(inserted))))
}
