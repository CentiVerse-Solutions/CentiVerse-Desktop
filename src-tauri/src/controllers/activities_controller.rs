use crate::custom_errors::app::AppError;
use crate::entities::activities::{self, Entity as Activity};
use crate::models::activities::*;
use axum::{
    extract::{Extension, Json, Path},
    http::StatusCode,
    response::IntoResponse,
    Json as AxumJson,
};
use chrono::Utc;
use rust_decimal::Decimal;
use crate::request_verifier::{
    activities::check_activity_exists_in_group,
    groups::{check_group_exists, check_user_exists_in_group},
};
use sea_orm::*;
use serde_json::json;
use uuid::Uuid;
use dotenv::dotenv;
use std::collections::HashMap;
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

     update_group_total_expense(&db, payload.group_id).await?;

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

    update_group_total_expense(&db, payload.group_id).await?;

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

    let activity = Activity::find_by_id(payload.activity_id)
        .one(&db)
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?
        .ok_or(AppError::NotFound("Activity not found".to_string()))?;
    if activity.paid_by_id != user_id {
        return Err(AppError::Unauthorized(
            "You are not authorized to delete this activity".to_string(),
        ));
    }
    let activity_amount = activity.amount;

    let delete_result = Activity::delete_by_id(payload.activity_id)
        .exec(&db)
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    if delete_result.rows_affected == 0 {
        return Err(AppError::NotFound("Activity not found".to_string()));
    }
    use crate::entities::groups::{self, Entity as Group};
    
    let group = Group::find_by_id(payload.group_id)
        .one(&db)
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?
        .ok_or(AppError::NotFound("Group not found".to_string()))?;

     let current_total = group.total_expense;
    
    let mut group_model = group.into_active_model();
    
    let new_total = current_total - activity_amount;
    group_model.total_expense = sea_orm::ActiveValue::Set(new_total);
    group_model.updated_at = sea_orm::ActiveValue::Set(Utc::now().into());
    
    group_model
        .update(&db)
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

        
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


async fn update_group_total_expense(
    db: &DatabaseConnection,
    group_id: Uuid,
) -> Result<(), AppError> {

    let total: Option<rust_decimal::Decimal> = Activity::find()
        .filter(activities::Column::GroupId.eq(group_id))
        .select_only()
        .column_as(activities::Column::Amount.sum(), "total_amount")
        .into_tuple()
        .one(db)
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;



    let total = total.unwrap_or_else(|| rust_decimal::Decimal::new(0, 0));
    
    use crate::entities::groups::{self, Entity as Group};
    
    let group = Group::find_by_id(group_id)
        .one(db)
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?
        .ok_or(AppError::NotFound("Group not found".to_string()))?;
    
    let mut group_model = group.into_active_model();
    
    group_model.total_expense = sea_orm::ActiveValue::Set(total);
    group_model.updated_at = sea_orm::ActiveValue::Set(Utc::now().into());
    group_model
        .update(db)
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    Ok(())
}

pub async fn get_dues_handler(
    Extension(user_id): Extension<Uuid>,
    Extension(db): Extension<sea_orm::DatabaseConnection>,
    Json(payload): Json<GetDuesReq>,
) -> Result< impl IntoResponse, AppError> {
    payload.check()?;
    check_group_exists(&db,payload.group_id).await?;
    check_user_exists_in_group(&db,payload.group_id,user_id).await?;
    let response = if payload.simplify {
        get_dues_simplified(&db, payload.group_id).await?
    } else {
        get_dues_detailed(&db, payload.group_id).await?
    };
    Ok(response)
}


async fn get_dues_simplified(
    db: &DatabaseConnection,
    group_id: Uuid,
) -> Result<Json<serde_json::Value>, AppError> {
    use crate::entities::activities::Column as ActivityColumn;
    let activities = crate::entities::activities::Entity::find()
        .filter(ActivityColumn::GroupId.eq(group_id))
        .all(db)
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;
    
    // Map to track net dues per user
    let mut dues_map: HashMap<Uuid, Decimal> = HashMap::new();
    for activity in activities {
        // Deserialize the JSON fields for members and amounts.
        let split_members: Vec<Uuid> = serde_json::from_value(activity.split_members.clone())
            .map_err(|e| AppError::DatabaseError(e.to_string()))?;
        let split_amounts: Vec<Decimal> = serde_json::from_value(activity.split_amounts.clone())
            .map_err(|e| AppError::DatabaseError(e.to_string()))?;

        // Credit the user who paid the full amount.
        *dues_map.entry(activity.paid_by_id).or_insert(Decimal::ZERO) += activity.amount;
        // For each member, debit their share.
        for (i, member) in split_members.into_iter().enumerate() {
            let split_amt = split_amounts.get(i).cloned().unwrap_or(Decimal::ZERO);
            *dues_map.entry(member).or_insert(Decimal::ZERO) -= split_amt;
        }
    }
    // Convert our map into a vector for the response.
    let dues: Vec<UserDue> = dues_map
        .into_iter()
        .map(|(user_id, amount)| UserDue { user_id, amount })
        .collect();
    let response = SimplifiedDuesResponse { dues };
    // Serialize the response into a JSON value.
    Ok(Json(serde_json::to_value(response).unwrap()))
}

// For a detailed dues response, we return each activity with its corresponding split breakdown.
async fn get_dues_detailed(
    db: &DatabaseConnection,
    group_id: Uuid,
) -> Result<Json<serde_json::Value>, AppError> {
    use crate::entities::activities::Column as ActivityColumn;
    let activities_list = crate::entities::activities::Entity::find()
        .filter(ActivityColumn::GroupId.eq(group_id))
        .all(db)
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;
    
    let mut dues: Vec<DetailedDue> = Vec::new();
    for activity in activities_list {
        let split_details = compute_split_details(activity.split_members.clone(), activity.split_amounts.clone())?;
        let detailed_due = DetailedDue {
            activity_id: activity.id,
            description: activity.description,
            paid_by: activity.paid_by_id,
            amount: activity.amount,
            split_details,
        };
        dues.push(detailed_due);
    }
    let response = DetailedDuesResponse { dues };
    Ok(Json(serde_json::to_value(response).unwrap()))
}

// Compute split details from the JSON values of members and amounts.
// This function deserializes the JSON into vectors and zips them together.
fn compute_split_details(
    members_json: JsonValue,
    amounts_json: JsonValue,
) -> Result<Vec<SplitDetail>, AppError> {
    let members: Vec<Uuid> = serde_json::from_value(members_json)
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;
    let amounts: Vec<Decimal> = serde_json::from_value(amounts_json)
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;
    
    let details: Vec<SplitDetail> = members
        .into_iter()
        .enumerate()
        .map(|(i, uid)| {
            let amount = amounts.get(i).cloned().unwrap_or(Decimal::ZERO);
            SplitDetail { user_id: uid, amount }
        })
        .collect();
    Ok(details)
}