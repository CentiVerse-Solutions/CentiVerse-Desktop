use sea_orm::{EntityTrait, ColumnTrait, QueryFilter, DatabaseConnection};
use crate::entities::{groups,group_members};
use crate::custom_errors::app::AppError;
use uuid::Uuid;

pub async fn check_group_exists(db: &DatabaseConnection, group_id: Uuid) -> Result<(), AppError> {
    let existing_group = groups::Entity::find()
        .filter(groups::Column::Id.eq(group_id))
        .one(db)
        .await
        .map_err(|_| AppError::InternalServerError)?;

    if existing_group.is_none() {
        return Err(AppError::NotFound("Group not found".into()));
    }

    Ok(())
}

pub async fn check_user_exists_in_group(
    db: &DatabaseConnection, 
    group_id: Uuid, 
    user_id: Uuid
) -> Result<(), AppError> {
    let user = group_members::Entity::find()
        .filter(group_members::Column::GroupId.eq(group_id))
        .filter(group_members::Column::MemberId.eq(user_id)) 
        .one(db)
        .await
        .map_err(|_| AppError::InternalServerError)?;

    if user.is_none() {
        return Err(AppError::UserNotInGroup("User not found in group".into()));
    }

    Ok(())
}