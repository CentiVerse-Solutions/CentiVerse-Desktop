use uuid::Uuid;
use sea_orm::entity::prelude::*;
use serde::{Serialize, Deserialize};
use crate::custom_errors::{activities::{ActivityError}};

#[derive(Debug, Clone, PartialEq,Deserialize)]
pub struct CreateActivityReq {
    pub description: String,
    pub paid_by_id: Uuid,
    pub group_id: Uuid,
    pub amount: Decimal,
    pub split_members: Vec<Uuid>,
    pub split_amounts: Vec<Decimal>,
    pub expense_logo: Option<String>,
}

impl CreateActivityReq{
    pub fn new(
        description: String,
        paid_by_id:Uuid,
        group_id: Uuid,
        amount: Decimal,
        split_members: Vec<Uuid>,
        split_amounts: Vec<Decimal>,
        expense_logo: Option<String>
    ) -> Self {
        Self {
            description,
            paid_by_id,
            group_id,
            amount,
            split_members,
            split_amounts,
            expense_logo,
        }
    }

    pub fn check(&mut self) -> Result<(), ActivityError> {

        if self.description.trim().is_empty() {
            return Err(ActivityError::ActivityReqValidationError(
                "Description cannot be empty".into(),
            ));
        }
        
        if let Some(logo) = &self.expense_logo {
            if logo.trim().is_empty() {
                self.expense_logo = None;
            }
        }
    
        if self.amount <= Decimal::ZERO {
            return Err(ActivityError::ActivityReqValidationError("Amount must be greater than zero".into()));
        }

        if self.split_members.is_empty() || self.split_amounts.is_empty() {
            return Err(ActivityError::ActivityReqValidationError(
                "Split members and split amounts cannot be empty".into(),
            ));
        }
        if self.split_members.len() != self.split_amounts.len() {
            return Err(ActivityError::ActivityReqValidationError(
                "Split members and split amounts must have the same length".into(),
            ));
        }

        let total_split: Decimal = self.split_amounts.iter().sum();
        if total_split != self.amount {
            return Err(ActivityError::AmountsDontAddUp(
                "Total split amount does not match the main amount".into(),
            ));
        }
    
        Ok(())
    }
    
}


#[derive(Debug, Clone, PartialEq,Serialize)]
pub struct ActivityRes {
    pub id: Uuid,
    pub description: String,
    pub paid_by_id: Uuid,
    pub group_id: Uuid,
    pub time: DateTimeWithTimeZone,
    pub amount: Decimal,
    pub split_members: Vec<Uuid>,
    pub split_amounts: Vec<Decimal>,
    pub user_involvement: bool,
    pub expense_logo: Option<String>,
    pub created_at: DateTimeWithTimeZone,
    pub updated_at: DateTimeWithTimeZone,
}

impl ActivityRes{
    pub fn new(
        id: Uuid,
        description: String,
        paid_by_id: Uuid,
        group_id: Uuid,
        time: DateTimeWithTimeZone,
        amount: Decimal,
        split_members: Vec<Uuid>,
        split_amounts: Vec<Decimal>,
        user_involvement: bool,
        expense_logo: Option<String>,
        created_at: DateTimeWithTimeZone,
        updated_at: DateTimeWithTimeZone,
    ) -> Self {
        Self {
            id,
            description,
            paid_by_id,
            group_id,
            time,
            amount,
            split_members,
            split_amounts,
            user_involvement,
            expense_logo,
            created_at,
            updated_at
        }
    }
}


impl From<crate::entities::activities::Model> for ActivityRes {
    fn from(activity: crate::entities::activities::Model) -> Self {
        Self::new(
            activity.id,
            activity.description,
            activity.paid_by_id,
            activity.group_id,
            activity.time,
            activity.amount,
            activity.split_members.clone(), 
            activity.split_amounts.clone(),
            activity.user_involvement,
            activity.expense_logo,
            activity.created_at,
            activity.updated_at,
        )
    }
}
