// Import necessary crates
use axum::{routing::get, Router};
use std::net::SocketAddr;

#[tokio::main]
async fn main() {
    // Spawn the Axum server on a background task
    tokio::spawn(async {
        run_axum_server().await;
    });

    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// Function to run an example Axum server
async fn run_axum_server() {
    // Define a simple route
    async fn hello() -> &'static str {
        "Hello from Axum!"
    }

    // Build the router
    let app = Router::new().route("/api/hello", get(hello));

    // Define the address (for example, localhost:3000)
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("Axum server listening on {}", addr);

    // Run the Axum server
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}
