use crate::custom_errors::app::AppError;
use rust_decimal::Decimal;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::json;
use uuid::Uuid;

#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct CreateActivityReq {
    pub description: String,
    pub group_id: Uuid,
    pub amount: Decimal,
    pub split_members: Vec<Uuid>,
    pub split_amounts: Vec<Decimal>,
    pub expense_logo: Option<String>,
}

impl CreateActivityReq {
    pub fn new(
        description: String,
        group_id: Uuid,
        amount: Decimal,
        split_members: Vec<Uuid>,
        split_amounts: Vec<Decimal>,
        expense_logo: Option<String>,
    ) -> Self {
        Self {
            description,
            group_id,
            amount,
            split_members,
            split_amounts,
            expense_logo,
        }
    }

    pub fn check(&mut self) -> Result<(), AppError> {
        if self.description.trim().is_empty() {
            return Err(AppError::ValidationError(
                "Description cannot be empty".into(),
            ));
        }

        if self.group_id == Uuid::nil() {
            return Err(AppError::ValidationError("Group Id cannot be empty".into()));
        }

        if let Some(logo) = &self.expense_logo {
            if logo.trim().is_empty() {
                self.expense_logo = None;
            }
        }

        if self.amount <= Decimal::ZERO {
            return Err(AppError::ValidationError(
                "Amount must be greater than zero".into(),
            ));
        }

        if self.split_members.is_empty() || self.split_amounts.is_empty() {
            return Err(AppError::ValidationError(
                "Split members and split amounts cannot be empty".into(),
            ));
        }
        if self.split_members.len() != self.split_amounts.len() {
            return Err(AppError::ValidationError(
                "Split members and split amounts must have the same length".into(),
            ));
        }

        let total_split: Decimal = self.split_amounts.iter().sum();
        if total_split != self.amount {
            return Err(AppError::AmountsDontAddUp(
                "Total split amount does not match the main amount".into(),
            ));
        }

        Ok(())
    }
}

#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct ActivityRes {
    pub id: Uuid,
    pub description: String,
    pub paid_by_id: Uuid,
    pub group_id: Uuid,
    pub time: DateTimeWithTimeZone,
    pub amount: Decimal,
    pub split_members: Json,
    pub split_amounts: Json,
    pub user_involvement: bool,
    pub expense_logo: Option<String>,
    pub created_at: DateTimeWithTimeZone,
    pub updated_at: DateTimeWithTimeZone,
}

impl ActivityRes {
    pub fn new(
        id: Uuid,
        description: String,
        paid_by_id: Uuid,
        group_id: Uuid,
        time: DateTimeWithTimeZone,
        amount: Decimal,
        split_members: Json,
        split_amounts: Json,
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
            updated_at,
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
            json!(activity.split_members.clone()),
            json!(activity.split_amounts.clone()),
            activity.user_involvement,
            activity.expense_logo,
            activity.created_at,
            activity.updated_at,
        )
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateActivityReq {
    pub id: Uuid,
    pub description: Option<String>,
    pub group_id: Uuid,
    pub amount: Option<Decimal>,
    pub split_members: Option<Vec<Uuid>>,
    pub split_amounts: Option<Vec<Decimal>>,
    pub expense_logo: Option<Option<String>>, // Double Option to handle setting to null
}

impl UpdateActivityReq {
    pub fn check(&self) -> Result<(), crate::custom_errors::app::AppError> {
        // Manual validation
        if self.id == Uuid::nil() {
            return Err(crate::custom_errors::app::AppError::ValidationError(
                "Activity ID cannot be empty".to_string(),
            ));
        }

        if let Some(description) = &self.description {
            if description.is_empty() || description.len() > 255 {
                return Err(crate::custom_errors::app::AppError::ValidationError(
                    "Description must be between 1 and 255 characters".to_string(),
                ));
            }
        }

        if let Some(amount) = &self.amount {
            if amount.is_sign_negative() {
                return Err(crate::custom_errors::app::AppError::ValidationError(
                    "Amount must be positive".to_string(),
                ));
            }
        }

        // Validate split_members and split_amounts have same length
        if let (Some(split_members), Some(split_amounts)) =
            (&self.split_members, &self.split_amounts)
        {
            if split_members.is_empty() || split_amounts.is_empty() {
                return Err(AppError::ValidationError(
                    "Split members and split amounts cannot be empty".into(),
                ));
            }
            if split_members.len() != split_amounts.len() {
                return Err(crate::custom_errors::app::AppError::ValidationError(
                    "Split amounts must match the number of split members".to_string(),
                ));
            }
            let total_split: Decimal = split_amounts.iter().sum();
            if let Some(amount) = &self.amount {
            if total_split != *amount {
                return Err(AppError::AmountsDontAddUp(
                    "Total split amount does not match the main amount".into(),
                ));
            }
        }
    }
        Ok(())
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DeleteActivityReq {
    pub activity_id: Uuid,
    pub group_id: Uuid,
}

impl DeleteActivityReq {
    pub fn check(&self) -> Result<(), crate::custom_errors::app::AppError> {
        if self.activity_id == Uuid::nil() {
            return Err(crate::custom_errors::app::AppError::ValidationError(
                "Activity ID cannot be empty".to_string(),
            ));
        }

        if self.group_id == Uuid::nil() {
            return Err(crate::custom_errors::app::AppError::ValidationError(
                "Group ID cannot be empty".to_string(),
            ));
        }

        Ok(())
    }
}


#[derive(Debug, Serialize, Deserialize)]
pub struct GetActivitiesReq {
    pub group_id: Uuid,
}

impl GetActivitiesReq {
    pub fn check(&self) -> Result<(), crate::custom_errors::app::AppError> {
        if self.group_id == Uuid::nil() {
            return Err(crate::custom_errors::app::AppError::ValidationError(
                "Group ID cannot be empty".to_string(),
            ));
        }
        
        Ok(())
    }
}