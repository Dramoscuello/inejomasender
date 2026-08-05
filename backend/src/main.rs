mod auth;
mod config;
mod db;
mod handlers;
mod models;
mod socket;

use axum::{
    routing::{delete, get, post, put},
    Router,
};
use socketioxide::SocketIo;
use tower_http::cors::{Any, CorsLayer};
use config::Config;
use db::init_db;
use handlers::{auth::login, files::*, grades::*, sessions::*, subjects::*};
use models::{AppState, RoomCounter};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let config = Config::from_env();
    println!("Starting InejomaSender Backend on port {}...", config.port);

    let pool = match init_db(&config).await {
        Ok(p) => {
            println!("--> Connected to PostgreSQL successfully.");
            p
        }
        Err(e) => {
            eprintln!("--> Warning: DB connection failed ({e}). Proceeding in standalone/wait mode.");
            return Err(e);
        }
    };

    let room_counter: RoomCounter = Arc::new(Mutex::new(HashMap::new()));

    let (socket_layer, io) = SocketIo::new_layer();
    socket::configure(&io, room_counter.clone());

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let state = AppState {
        pool,
        config: config.clone(),
        room_counter: room_counter.clone(),
    };

    let app = Router::new()
        .route("/api/auth/login", post(login))
        .route("/api/grades", get(list_grades).post(create_grade))
        .route("/api/grades/{id}", put(update_grade).delete(delete_grade))
        .route("/api/subjects", get(list_subjects).post(create_subject))
        .route("/api/subjects/{id}", put(update_subject).delete(delete_subject))
        .route("/api/sessions/start", post(start_session))
        .route("/api/sessions/end/{id}", post(end_session))
        .route("/api/sessions/verify/{pin}", get(verify_pin))
        .route("/api/sessions", get(list_sessions))
        .route("/api/sessions/{id}", delete(delete_session))
        .route("/api/sessions/{id}/count", get(get_connection_count))
        .route("/api/files/upload", post(upload_file))
        .route("/api/files/session/{pin}", get(list_session_files))
        .route("/api/files/download/{id}", get(download_file))
        .route("/api/files/download-zip/{pin}", get(download_zip))
        .route("/api/files/{id}", delete(delete_file))
        .layer(cors)
        .layer(socket_layer)
        .with_state(state);

    let addr = format!("0.0.0.0:{}", config.port);
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    println!("--> InejomaSender Backend server listening on http://{}", addr);

    axum::serve(listener, app).await?;

    Ok(())
}
