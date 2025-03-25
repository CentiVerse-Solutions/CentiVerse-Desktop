use axum::{
    http::{Request, StatusCode},
    middleware::Next,
    response::Response,
    extract::Extension,
};
use sea_orm::{EntityTrait, ColumnTrait, QueryFilter, DatabaseConnection};
use crate::entities::users;
use crate::custom_errors::auth::AuthError;
use uuid::Uuid;

// need fixessss!!!!|||||||||||||


pub async fn verify_user_id<B>(
    Extension(db): Extension<DatabaseConnection>,
    mut req: Request<B>,
    next: Next<B>,
) -> Result<Response, StatusCode> {
    // Extract user ID from request (assuming it's passed as a header)
    let user_id = req
        .headers()
        .get("user-id")
        .and_then(|value| value.to_str().ok())
        .and_then(|s| Uuid::parse_str(s).ok());

    let user_id = match user_id {
        Some(id) => id,
        None => return Err(StatusCode::UNAUTHORIZED), 
    };

    // Check if user exists in the database
    let existing_user = users::Entity::find()
        .filter(users::Column::Id.eq(user_id))
        .one(&db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?; 

    if existing_user.is_none() {
        return Err(StatusCode::UNAUTHORIZED); 
    }

  
    Ok(next.run(req).await)
}
