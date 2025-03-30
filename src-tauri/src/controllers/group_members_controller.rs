use chrono::Utc;
use crate::models::group_members::{AddGroupMemberReq, AddGroupMemberRes};
use crate::entities::group_members::{self, ActiveModel};
use crate::custom_errors::app::AppError;
use axum::{
    extract::{Json, Extension},
    response::IntoResponse,
    http::StatusCode
};
use crate::request_verifier::groups::{check_group_exists,check_user_exists_in_group};
use sea_orm::{EntityTrait, Set, QueryFilter, ColumnTrait};
use uuid::Uuid;

pub async fn add_member_to_group(
    Extension(user_id): Extension<Uuid>,
    Extension(db): Extension<sea_orm::DatabaseConnection>,
    Json(payload): Json<AddGroupMemberReq>,
) -> Result<impl IntoResponse, AppError> {
    payload.check()?;

    if let Err(err) = check_group_exists(&db, payload.group_id).await {
        return Err(err);
    }

    if let Err(err) = check_user_exists_in_group(&db, payload.group_id, user_id).await {
        return Err(err);
    }

    let mut new_members = Vec::new();
    for member_id in payload.member_ids {
        if check_user_exists_in_group(&db, payload.group_id, member_id)
            .await
            .is_err()
        {
            new_members.push(group_members::ActiveModel {
                id: Set(Uuid::new_v4()),
                group_id: Set(payload.group_id),
                member_id: Set(member_id),
                joined_at: Set(Utc::now().into()),
            });
        }
    }

    let new_ids: Vec<Uuid> = new_members
        .iter()
        .map(|am| am.id.as_ref().clone())
        .collect();

    
    let _insert_result = group_members::Entity::insert_many(new_members)
        .on_empty_do_nothing()
        .exec(&db)
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    
    let inserted_models = group_members::Entity::find()
        .filter(group_members::Column::Id.is_in(new_ids))
        .all(&db)
        .await
        .map_err(|e| AppError::DatabaseError(e.to_string()))?;

    Ok((StatusCode::OK, Json(AddGroupMemberRes::from(inserted_models))))
}
