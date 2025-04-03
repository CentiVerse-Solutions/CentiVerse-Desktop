use axum::{
    http::Request,
    middleware::Next,
    response::Response,
    extract::Extension,
};
use sea_orm::{EntityTrait, ColumnTrait, QueryFilter, DatabaseConnection};
use crate::entities::users;
use uuid::Uuid;
use jsonwebtoken::{decode, DecodingKey, Validation, Algorithm, TokenData};
use crate::models::auth::Claims;
use crate::custom_errors::app::AppError;
use dotenv::dotenv;
use std::env;

pub async fn verify_user<B>(
    Extension(db): Extension<DatabaseConnection>,
    mut req: Request<B>,
    next: Next<B>,
) -> Result<Response, AppError> {

    dotenv().ok();
    let jwt_secret =env::var("JWT_SECRET").expect("JWT_SECRET must be set");

    
    let token = req
        .headers()
        .get("Cookie")
        .and_then(|value| value.to_str().ok())
        .and_then(|cookie_header| {
            cookie_header.split(';').find_map(|cookie| {
                let cookie = cookie.trim();
                if cookie.starts_with("auth_token=") {
                    Some(cookie.trim_start_matches("auth_token=").to_string())
                } else {
                    None
                }
            })
        })
        .ok_or_else(|| AppError::Unauthorized("Missing auth_token cookie".into()))?;

    
    let decoding_key = DecodingKey::from_secret(jwt_secret.as_ref());
    let token_data: TokenData<Claims> = decode::<Claims>(&token, &decoding_key, &Validation::new(Algorithm::HS256))
        .map_err(|_| AppError::Unauthorized("Invalid token".into()))?;

    
    let user_id = Uuid::parse_str(&token_data.claims.sub)
        .map_err(|_| AppError::Unauthorized("Invalid user id in token".into()))?;

    
    let existing_user = users::Entity::find()
        .filter(users::Column::Id.eq(user_id))
        .one(&db)
        .await
        .map_err(|_| AppError::InternalServerError)?;

    if existing_user.is_none() {
        return Err(AppError::NotFound("User not found".into()));
    }
    req.extensions_mut().insert(user_id);
    Ok(next.run(req).await)
}

pub async fn check_user_exists(
    db: &DatabaseConnection,
    user_id: Uuid
) -> Result<(),AppError> {
    let user = users::Entity::find_by_id(user_id)
        .one(db)
        .await
        .map_err(|_| AppError::InternalServerError)?;

    if user.is_none() {
        return Err(AppError::NotFound("UserId doesn't exist".into()));
    }

    Ok(())
}