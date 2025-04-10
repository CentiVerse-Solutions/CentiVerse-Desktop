use chrono::Utc;
use crate::custom_errors::app::AppError;
use uuid::Uuid;
use jsonwebtoken::{encode, Header, EncodingKey};
use serde::Serialize;
use dotenv::dotenv;
use std::env;
use crate::models::auth::Claims;


pub fn generate_jwt(user_id: Uuid) -> Result<String, AppError> {
    dotenv().ok();
    let jwt_secret =env::var("JWT_SECRET").expect("JWT_SECRET must be set");
    let expiration = (Utc::now().timestamp() + (3600*24)) as usize;
    let claims = Claims {
        sub: user_id.to_string(),
        exp: expiration,
    };

    encode(&Header::default(), &claims, &EncodingKey::from_secret(jwt_secret.as_ref()))
        .map_err(|_| AppError::InternalServerError)
}

