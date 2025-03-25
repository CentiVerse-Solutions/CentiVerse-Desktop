use uuid::Uuid;
use sea_orm::entity::prelude::*;
use serde::{Serialize, Deserialize};
use crate::custom_errors::{auth::{AuthError}};

#[derive(Debug, Clone, PartialEq,Deserialize)]
pub struct AuthReq {
    pub oauth_provider: String,
    pub oauth_id: String,  
    pub username: String,
    pub email: String,
    pub upi_id: String,
}

impl AuthReq{
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

    pub fn check(&self) -> Result<(), AuthError> {
        if self.oauth_provider.trim().is_empty() {
            return Err(AuthError::AuthReqValidationError("OAuth provider is required".into()));
        }
        if self.oauth_id.trim().is_empty() {
            return Err(AuthError::AuthReqValidationError("OAuth ID is required".into()));
        }
        if self.username.trim().len() < 3 {
            return Err(AuthError::AuthReqValidationError("Username must not be empty".into()));
        }
        if !self.email.contains('@') {
            return Err(AuthError::AuthReqValidationError("Invalid email format".into()));
        }
        if self.upi_id.trim().len() < 5 {
            return Err(AuthError::AuthReqValidationError("UPI ID must Username must not be empty".into()));
        }
        Ok(())
    }
}

#[derive(Debug, Clone, PartialEq,Serialize)]
pub struct AuthRes {
    pub oauth_provider: String,
    pub oauth_id: String,  
    pub username: String,
    pub email: String,
    pub upi_id: String,
    pub id: Uuid,
    pub created_at: DateTimeWithTimeZone, 
    pub updated_at: DateTimeWithTimeZone,
}

impl AuthRes{
    pub fn new(
        oauth_provider: String,
        oauth_id: String,  
        username: String,
        email: String,
        upi_id: String,
        id: Uuid,
        created_at: DateTimeWithTimeZone, 
        updated_at: DateTimeWithTimeZone,
    ) -> Self {
        Self {
            oauth_provider,
            oauth_id,  
            username,
            email,
            upi_id,
            id,
            created_at, 
            updated_at,
        }
    }
}


impl From<crate::entities::users::Model> for AuthRes {
    fn from(user: crate::entities::users::Model) -> Self {
        Self::new(
            user.oauth_provider,
            user.oauth_id,
            user.username,
            user.email,
            user.upi_id,
            user.id,
            user.created_at,
            user.updated_at,
        )
    }
}


#[derive(Debug, Serialize)]
pub struct AuthOutput {
    pub token: String,
    pub user: AuthRes,
}

#[derive(Serialize, Deserialize )]
pub struct Claims {
    pub sub: String,
    pub exp: usize,
}