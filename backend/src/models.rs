use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use time::OffsetDateTime;
use crate::config::Config;

#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
    pub config: Config,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct User {
    pub id: i32,
    pub username: String,
    pub password_hash: String,
    pub created_at: Option<OffsetDateTime>,
    pub updated_at: Option<OffsetDateTime>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Subject {
    pub id: i32,
    pub name: String,
    pub created_at: Option<OffsetDateTime>,
    pub updated_at: Option<OffsetDateTime>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateSubjectRequest {
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateSubjectRequest {
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Grade {
    pub id: i32,
    pub name: String,
    pub description: Option<String>,
    pub created_at: Option<OffsetDateTime>,
    pub updated_at: Option<OffsetDateTime>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateGradeRequest {
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateGradeRequest {
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Session {
    pub id: i32,
    pub grade_id: i32,
    pub subject_id: i32,
    pub title: String,
    pub pin: String,
    pub is_active: bool,
    pub started_at: Option<OffsetDateTime>,
    pub created_at: Option<OffsetDateTime>,
    pub updated_at: Option<OffsetDateTime>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StartSessionRequest {
    pub grade_id: i32,
    pub subject_id: i32,
    pub title: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct SessionInfo {
    pub id: i32,
    pub grade_id: i32,
    pub grade_name: String,
    pub subject_id: i32,
    pub subject_name: String,
    pub title: String,
    pub pin: String,
    pub is_active: bool,
    pub started_at: Option<String>,
    pub created_at: Option<String>,
    pub file_count: i64,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct SharedFile {
    pub id: i32,
    pub session_id: Option<i32>,
    pub grade_id: i32,
    pub filename: String,
    pub file_path: String,
    pub file_size: i64,
    pub created_at: Option<OffsetDateTime>,
    pub updated_at: Option<OffsetDateTime>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub exp: usize,
}
