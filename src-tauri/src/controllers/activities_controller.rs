use crate::custom_errors::app::AppError;
use crate::entities::activities::{self, Entity as Activity};
use crate::models::activities::{
    ActivityRes, CreateActivityReq, DeleteActivityReq, UpdateActivityReq,GetActivitiesReq,
};
use axum::{
    extract::{Extension, Json, Path},
    http::StatusCode,
    response::IntoResponse,
    Json as AxumJson,
};
use chrono::Utc;

use crate::request_verifier::{
    activities::check_activity_exists_in_group,
    groups::{check_group_exists, check_user_exists_in_group},
};
use sea_orm::*;
use serde_json::json;
use uuid::Uuid;
use dotenv::dotenv;
use std::env;

pub async fn create_activity_handler(
    Extension(user_id): Extension<Uuid>,
    Extension(db): Extension<sea_orm::DatabaseConnection>,
    Json(mut payload): Json<CreateActivityReq>,
) -> Result<impl IntoResponse, AppError> {
    // println!("{}",user_id);
    payload.check()?;
    check_group_exists(&db, payload.group_id).await?;
    check_user_exists_in_group(&db, payload.group_id, user_id).await?;

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

pub async fn update_activity_handler(
    Extension(user_id): Extension<Uuid>,
    Extension(db): Extension<sea_orm::DatabaseConnection>,
    Json(payload): Json<UpdateActivityReq>,
) -> Result<impl IntoResponse, AppError> {
    payload.check()?;
    check_group_exists(&db, payload.group_id).await?;
    check_user_exists_in_group(&db, payload.group_id, user_id).await?;
    check_activity_exists_in_group(&db, payload.id, payload.group_id).await?;

    let activity = Activity::find_by_id(payload.id)
        .one(&db)
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?
        .ok_or(AppError::NotFound("Activity not found".to_string()))?;

    if activity.paid_by_id != user_id {
        return Err(AppError::Unauthorized(
            "You are not authorized to update this activity".to_string(),
        ));
    }

    let mut activity_model = activity.into_active_model();
    let old_activity = activity_model.clone();

    if let Some(description) = payload.description {
        activity_model.description = Set(description);
    }

    if let Some(amount) = payload.amount {
        activity_model.amount = Set(amount);
    }

    if let Some(split_members) = payload.split_members {
        activity_model.split_members = Set(json!(split_members));
        activity_model.user_involvement = Set(split_members.contains(&user_id));
    }

    if let Some(split_amounts) = payload.split_amounts {
        activity_model.split_amounts = Set(json!(split_amounts));
    }

    if let Some(expense_logo) = payload.expense_logo {
        activity_model.expense_logo = Set(expense_logo);
    }

    if old_activity == activity_model {
        return Err(AppError::ValidationError("No changes detected".to_string()));
    }

    activity_model.updated_at = Set(Utc::now().into());

    let updated = activity_model
        .update(&db)
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    Ok((StatusCode::OK, AxumJson(ActivityRes::from(updated))))
}

pub async fn delete_activity_handler(
    Extension(user_id): Extension<Uuid>,
    Extension(db): Extension<sea_orm::DatabaseConnection>,
    Json(payload): Json<DeleteActivityReq>,
) -> Result<impl IntoResponse, AppError> {
    payload.check()?;
    check_group_exists(&db, payload.group_id).await?;
    check_activity_exists_in_group(&db, payload.activity_id, payload.group_id).await?;
    check_user_exists_in_group(&db, payload.group_id, user_id).await?;

    // Find the activity to check ownership
    let activity = Activity::find_by_id(payload.activity_id)
        .one(&db)
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?
        .ok_or(AppError::NotFound("Activity not found".to_string()))?;

    // Check if the user is the owner of the activity
    if activity.paid_by_id != user_id {
        return Err(AppError::Unauthorized(
            "You are not authorized to delete this activity".to_string(),
        ));
    }

    let delete_result = Activity::delete_by_id(payload.activity_id)
        .exec(&db)
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    if delete_result.rows_affected == 0 {
        return Err(AppError::NotFound("Activity not found".to_string()));
    }
    Ok((StatusCode::OK, Json("Activity Deleted successfully")))
}


pub async fn get_all_activities_handler(
    Extension(user_id): Extension<Uuid>,
    Extension(db): Extension<sea_orm::DatabaseConnection>,
    Json(payload): Json<GetActivitiesReq>,
) -> Result<impl IntoResponse, AppError> {

    payload.check()?;
    check_group_exists(&db, payload.group_id).await?;
    check_user_exists_in_group(&db, payload.group_id, user_id).await?;

    let page_size: u64 = env::var("PAGE_SIZE")
    .map_err(|_| AppError::ConfigError("PAGE_SIZE must be set".to_string()))?
    .trim()
    .parse()
    .map_err(|_| AppError::ConfigError("Invalid PAGE_SIZE value".to_string()))?;

    let paginator = activities::Entity::find()
    .filter(activities::Column::GroupId.eq(payload.group_id))
    .paginate(&db, page_size);

    let mut all_activites = Vec::new();
    let mut page_stream = paginator;
    

    while let Some(activities_page) = page_stream
        .fetch_and_next()
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))? 
    {
        all_activites.extend(activities_page);
    }

    let activity_responses: Vec<ActivityRes> = all_activites
        .into_iter()
        .map(ActivityRes::from)
        .collect();

    Ok((StatusCode::OK, AxumJson(activity_responses)))
}