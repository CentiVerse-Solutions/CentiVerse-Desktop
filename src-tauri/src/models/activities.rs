use uuid::Uuid;
use sea_orm::entity::prelude::*;
use serde::{Serialize, Deserialize};


#[derive(Debug, Clone, PartialEq,Deserialize)]
pub struct CreateActivityReq {
    pub id: Uuid,
    pub description: Option<String>,
    pub paid_by_id: Uuid,
    pub group_id: Uuid,
    pub amount: Decimal,
    pub split_members: Vec<Uuid>,
    pub split_amounts: Vec<Decimal>,
    pub expense_logo: Option<String>,
}

impl CreateActivityReq{
    pub fn new(
        id: Uuid,
        description: Option<String>,
        paid_by_id:Uuid,
        group_id: Uuid,
        amount: Decimal,
        split_members: Vec<Uuid>,
        split_amounts: Vec<Decimal>,
        expense_logo: Option<String>
    ) -> Self {
        Self {
            id,
            description,
            paid_by_id,
            group_id,
            amount,
            split_members,
            split_amounts,
            expense_logo,
        }
    }

}
