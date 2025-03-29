use uuid::Uuid;
use sea_orm::entity::prelude::*;
use serde::{Serialize, Deserialize};
use crate::custom_errors::app::AppError;
#[derive(Debug, Clone, PartialEq,Deserialize)]

pub struct AddGroupMemberReq{
    pub group_id: Uuid,
    pub member_ids: Json,
}

impl AddGroupMemberReq{
    pub fn new(
        group_id: Uuid,
        member_ids: Json,
    ) -> Self {
        Self{
            group_id,
            member_ids,
        }
    }
    pub fn check(mut self)->Result<(),AppError>{
        if self.group_id == Uuid::nil() {
            return Err(AppError::ValidationError("Group Id cannot be empty".into()));
        }
        if self.member_ids.is_null() {
            return Err(AppError::ValidationError("Member Ids cannot be empty".into()));
        }
        Ok(())
    }
}