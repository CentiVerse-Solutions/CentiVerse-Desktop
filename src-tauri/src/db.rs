
use sqlx::{PgPool, postgres::PgPoolOptions};
use std::env;
use dotenv::dotenv;
pub async fn establish_connection() -> Result<PgPool, sqlx::Error> {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set in the environment");
    PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
}
