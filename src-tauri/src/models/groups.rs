use uuid::Uuid;
use sea_orm::entity::prelude::*;
use serde::{Serialize, Deserialize};
use crate::custom_errors::app::AppError;
#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct CreateGroupReq {
    pub group_name: String,
    pub auto_logo: Option<String>,
}

impl CreateGroupReq {
    pub fn new(group_name: String, auto_logo: Option<String>) -> Self {
        Self { group_name, auto_logo }
    }

    pub fn check(&mut self) -> Result<(), AppError> {
        if self.group_name.trim().is_empty() {
            return Err(AppError::ValidationError("Group Name cannot be empty".into()));
        }
        if let Some(logo) = &self.auto_logo {
            if logo.trim().is_empty() {
                self.auto_logo = None;
            }
        }
        Ok(())
    }
}

#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct GroupRes {
    pub id: Uuid,
    pub creator_id: Uuid,
    pub group_name: String,
    pub auto_logo: Option<String>,
    pub total_expense: Decimal,
    pub created_at: DateTimeWithTimeZone,
    pub updated_at: DateTimeWithTimeZone,
    pub admin_id: Uuid,
    pub joined_at: DateTimeWithTimeZone,
}


impl GroupRes{
    pub fn new(
        id: Uuid,
        creator_id: Uuid,
        group_name: String,
        auto_logo: Option<String>,
        total_expense: Decimal,
        created_at: DateTimeWithTimeZone,
        updated_at: DateTimeWithTimeZone,
        admin_id: Uuid,
        joined_at: DateTimeWithTimeZone,
    ) -> Self{
        Self{
            id,
            creator_id,
            group_name,
            auto_logo,
            total_expense,
            created_at,
            updated_at,
            admin_id,
            joined_at,
        }
    }
}

impl From<(crate::entities::groups::Model, crate::entities::group_members::Model)> for GroupRes {
    fn from((group, admin): (crate::entities::groups::Model, crate::entities::group_members::Model)) -> Self {
        Self {
            id: group.id,
            creator_id: group.creator_id,
            group_name: group.group_name,
            auto_logo: group.auto_logo,
            total_expense: group.total_expense,
            created_at: group.created_at,
            updated_at: group.updated_at,
            admin_id: admin.id,
            joined_at: admin.joined_at,
        }
    }
}