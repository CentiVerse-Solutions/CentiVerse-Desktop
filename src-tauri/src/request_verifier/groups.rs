use axum::{
    extract::{Path, Extension},
    http::{StatusCode,Request},
    middleware::Next,
    response::Response,
};
use sea_orm::{EntityTrait, ColumnTrait, QueryFilter, DatabaseConnection};
use crate::entities::groups;
use crate::custom_errors::groups::GroupError;
use uuid::Uuid;

pub async fn verify_group<B>(
    Path(group_id): Path<Uuid>,
    Extension(db): Extension<DatabaseConnection>,
    mut req: Request<B>,
    next: Next<B>,
) -> Result<Response, GroupError> {

    let existing_group = groups::Entity::find()
        .filter(groups::Column::Id.eq(group_id))
        .one(&db)
        .await
        .map_err(|_| GroupError::InternalServerError)?;

    if existing_group.is_none() {
        return Err(GroupError::GroupNotFound("Group not found".into()));
    }

    req.extensions_mut().insert(group_id);

    Ok(next.run(req).await)
}
