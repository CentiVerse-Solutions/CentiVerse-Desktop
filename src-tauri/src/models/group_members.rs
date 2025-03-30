use sea_orm_migration::seaql_migrations::ActiveModel;
use uuid::Uuid;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use crate::{custom_errors::app::AppError, entities::group_members};

#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct AddGroupMemberReq {
    pub group_id: Uuid,
    pub member_ids: Vec<Uuid>,
}

impl AddGroupMemberReq {
    pub fn new(group_id: Uuid, member_ids: Vec<Uuid>) -> Self {
        Self {
            group_id,
            member_ids 
        }
    }

    pub fn check(&self) -> Result<(), AppError> {
        if self.group_id == Uuid::nil() {
            return Err(AppError::ValidationError("Group Id cannot be empty".into()));
        }
        if self.member_ids.is_empty() {
            return Err(AppError::ValidationError("Member Ids cannot be empty".into()));
        }
        Ok(())
    }
}

#[derive(Serialize)]
pub struct GroupMember {
    pub id: Uuid,
    pub group_id: Uuid,
    pub member_id: Uuid,
    pub joined_at: DateTimeWithTimeZone,
}

impl GroupMember {
    pub fn new(
        id: Uuid,
        group_id: Uuid,
        member_id: Uuid,
        joined_at: DateTimeWithTimeZone,
    ) -> Self {
        Self {
            id,
            group_id,
            member_id,
            joined_at,
        }
    }
}

impl From<crate::entities::group_members::Model> for GroupMember {
    fn from(model: crate::entities::group_members::Model) -> Self {
        Self::new(model.id, model.group_id, model.member_id, model.joined_at)
    }
}

#[derive(Serialize)]
pub struct AddGroupMemberRes {
    pub new_group_members: Vec<GroupMember>,
}

impl AddGroupMemberRes {
    pub fn new(new_group_members: Vec<GroupMember>) -> Self {
        Self { new_group_members }
    }
}

// Use `returning_all` to get inserted models directly
impl From<Vec<crate::entities::group_members::Model>> for AddGroupMemberRes {
    fn from(models: Vec<crate::entities::group_members::Model>) -> Self {
        Self::new(models.into_iter().map(GroupMember::from).collect())
    }
}