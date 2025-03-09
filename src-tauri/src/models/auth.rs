use uuid::Uuid;
use sea_orm::entity::prelude::*;
use serde::{Serialize, Deserialize};
use crate::custom_errors::{auth::{SignupError}};

#[derive(Debug, Clone, PartialEq,Deserialize)]
pub struct SignupReq {
    pub oauth_provider: String,
    pub oauth_id: String,  
    pub username: String,
    pub email: String,
    pub upi_id: String,
}

impl SignupReq{
    pub fn new(
        oauth_provider: String,
        oauth_id: String,
        username: String,
        email: String,
        upi_id: String,
    ) -> Self {
        Self {
            oauth_provider,
            oauth_id,
            username,
            email,
            upi_id,
        }
    }

    pub fn check(&self) -> Result<(), SignupError> {
        if self.oauth_provider.trim().is_empty() {
            return Err(SignupError::SignupReqValidationError("OAuth provider is required".into()));
        }
        if self.oauth_id.trim().is_empty() {
            return Err(SignupError::SignupReqValidationError("OAuth ID is required".into()));
        }
        if self.username.trim().len() < 3 {
            return Err(SignupError::SignupReqValidationError("Username must not be empty".into()));
        }
        if !self.email.contains('@') {
            return Err(SignupError::SignupReqValidationError("Invalid email format".into()));
        }
        if self.upi_id.trim().len() < 5 {
            return Err(SignupError::SignupReqValidationError("UPI ID must Username must not be empty".into()));
        }
        Ok(())
    }
}