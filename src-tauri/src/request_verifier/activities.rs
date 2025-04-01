use sea_orm::{EntityTrait, ColumnTrait, QueryFilter, DatabaseConnection};
use crate::entities::{activities};
use crate::custom_errors::app::AppError;
use uuid::Uuid;

pub async fn check_activity_exists_in_group (
    db: &DatabaseConnection, 
    activity_id: Uuid,
    group_id: Uuid
)-> Result<(), AppError> {
    // Check if the activity exists in the group
    let activity = activities::Entity::find()
        .filter(activities::Column::Id.eq(activity_id))
        .filter(activities::Column::GroupId.eq(group_id))
        .one(db)
        .await
        .map_err(|_| AppError::InternalServerError)?;

    if activity.is_none() {
        return Err(AppError::NotFound("Activity not found in group".into()));
    }

    Ok(())
}