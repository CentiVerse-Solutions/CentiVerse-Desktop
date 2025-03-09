mod db;
mod routes;
mod controllers;
mod entities;
mod models;
mod custom_errors;

use axum::{Router, Extension};

#[tokio::main]
async fn main() {

    let pool = db::establish_connection()
        .await;
        // .expect("Failed to connect to the database");
    let app: Router = routes::app_routes().layer(Extension(pool));

    let addr = "0.0.0.0:3000".parse().unwrap();
    println!("Server running on {}", addr);
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}
