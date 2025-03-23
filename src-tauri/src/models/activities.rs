use uuid::Uuid;
use sea_orm::entity::prelude::*;
use serde::{Serialize, Deserialize};
use crate::custom_errors::{activities::{ActivityError}};

#[derive(Debug, Clone, PartialEq,Deserialize)]
pub struct CreateActivityReq {
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
        description: Option<String>,
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

        if let Some(desc) = &self.description {
            if desc.trim().is_empty() {
                self.description = None;
            }
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
