use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use crate::models::{AppState, CreateSubjectRequest, Subject, UpdateSubjectRequest};
use crate::auth::AuthenticatedUser;

pub async fn list_subjects(
    State(state): State<AppState>,
) -> Result<Json<Vec<Subject>>, (StatusCode, String)> {
    let subjects: Vec<Subject> = sqlx::query_as("SELECT * FROM subjects ORDER BY id DESC")
        .fetch_all(&state.pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(subjects))
}

pub async fn create_subject(
    _user: AuthenticatedUser,
    State(state): State<AppState>,
    Json(payload): Json<CreateSubjectRequest>,
) -> Result<Json<Subject>, (StatusCode, String)> {
    let subject: Subject = sqlx::query_as(
        "INSERT INTO subjects (name) VALUES ($1) RETURNING *"
    )
    .bind(&payload.name)
    .fetch_one(&state.pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(subject))
}

pub async fn update_subject(
    _user: AuthenticatedUser,
    Path(id): Path<i32>,
    State(state): State<AppState>,
    Json(payload): Json<UpdateSubjectRequest>,
) -> Result<Json<Subject>, (StatusCode, String)> {
    let subject: Subject = sqlx::query_as(
        "UPDATE subjects SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *"
    )
    .bind(&payload.name)
    .bind(id)
    .fetch_one(&state.pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(subject))
}

pub async fn delete_subject(
    _user: AuthenticatedUser,
    Path(id): Path<i32>,
    State(state): State<AppState>,
) -> Result<StatusCode, (StatusCode, String)> {
    sqlx::query("DELETE FROM subjects WHERE id = $1")
        .bind(id)
        .execute(&state.pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::NO_CONTENT)
}
