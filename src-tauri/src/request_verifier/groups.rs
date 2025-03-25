use sea_orm::{EntityTrait, ColumnTrait, QueryFilter, DatabaseConnection};
use crate::entities::groups;
use crate::custom_errors::groups::GroupError;
use uuid::Uuid;

pub async fn check_group_exists(db: &DatabaseConnection, group_id: Uuid) -> Result<(), GroupError> {
    let existing_group = groups::Entity::find()
        .filter(groups::Column::Id.eq(group_id))
        .one(db)
        .await
        .map_err(|_| GroupError::InternalServerError)?;

    if existing_group.is_none() {
        return Err(GroupError::GroupNotFound("Group not found".into()));
    }

    Ok(())
}
