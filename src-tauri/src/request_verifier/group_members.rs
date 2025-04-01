use std::mem;

use sea_orm::{EntityTrait, ColumnTrait, QueryFilter, DatabaseConnection};
use crate::entities::{groups,group_members};
use crate::custom_errors::app::AppError;
use uuid::Uuid;

pub async fn check_group_member_exists_in_group(
    db: &DatabaseConnection, 
    member_id: Uuid
) -> Result<(), AppError> {
    let is_member = group_members::Entity::find()
        .filter(group_members::Column::Id.eq(member_id)) 
        .one(db)
        .await
        .map_err(|_| AppError::InternalServerError)?;

    if is_member.is_none() {
        return Err(AppError::NotFound("Group member not found".into()));
    }

    Ok(())
}
