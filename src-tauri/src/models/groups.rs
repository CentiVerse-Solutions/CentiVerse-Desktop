use uuid::Uuid;
use sea_orm::entity::prelude::*;
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, PartialEq,Deserialize)]
pub struct CreateGroupReq{
    pub group_name: String,
    pub auto_logo: Option<String>,
    pub total_expense: Decimal,
    pub created_at: DateTimeWithTimeZone,
    pub updated_at: DateTimeWithTimeZone,
}

impl CreateGroupReq{
    pub fn new(
        group_name: String,
        auto_logo: Option<String>,
        total_expense: Decimal,
        created_at: DateTimeWithTimeZone,
        updated_at: DateTimeWithTimeZone,
    ) ->  Self{
        Self {
            group_name,
            auto_logo,
            total_expense,
            created_at,
            updated_at,
        }
    }
}

#[derive(Debug, Clone, PartialEq,Serialize)]
pub struct GroupRes{
    pub id: Uuid,
    pub creator_id: Uuid,
    pub group_name: String,
    pub auto_logo: Option<String>,
    pub total_expense: Decimal,
    pub created_at: DateTimeWithTimeZone,
    pub updated_at: DateTimeWithTimeZone,
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
    ) -> Self{
        Self{
            id,
            creator_id,
            group_name,
            auto_logo,
            total_expense,
            created_at,
            updated_at,
        }
    }
}

impl From<crate::entities::groups::Model> for GroupRes{
    fn from(group: crate::entities::groups::Model) -> Self {
        Self::new(
            group.id,
            group.creator_id,
            group.group_name,
            group.auto_logo,
            group.total_expense,
            group.created_at,
            group.updated_at,
        )
    }
}