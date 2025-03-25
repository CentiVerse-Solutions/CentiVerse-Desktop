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