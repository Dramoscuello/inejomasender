use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use crate::models::{AppState, CreateGradeRequest, Grade, UpdateGradeRequest};
use crate::auth::AuthenticatedUser;

pub async fn list_grades(
    State(state): State<AppState>,
) -> Result<Json<Vec<Grade>>, (StatusCode, String)> {
    let grades: Vec<Grade> = sqlx::query_as("SELECT * FROM grades ORDER BY id DESC")
        .fetch_all(&state.pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(grades))
}

pub async fn create_grade(
    _user: AuthenticatedUser,
    State(state): State<AppState>,
    Json(payload): Json<CreateGradeRequest>,
) -> Result<Json<Grade>, (StatusCode, String)> {
    let grade: Grade = sqlx::query_as(
        "INSERT INTO grades (name, description) VALUES ($1, $2) RETURNING *"
    )
    .bind(&payload.name)
    .bind(&payload.description)
    .fetch_one(&state.pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(grade))
}

pub async fn update_grade(
    _user: AuthenticatedUser,
    Path(id): Path<i32>,
    State(state): State<AppState>,
    Json(payload): Json<UpdateGradeRequest>,
) -> Result<Json<Grade>, (StatusCode, String)> {
    let grade: Grade = sqlx::query_as(
        "UPDATE grades SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *"
    )
    .bind(&payload.name)
    .bind(&payload.description)
    .bind(id)
    .fetch_one(&state.pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(grade))
}

pub async fn delete_grade(
    _user: AuthenticatedUser,
    Path(id): Path<i32>,
    State(state): State<AppState>,
) -> Result<StatusCode, (StatusCode, String)> {
    sqlx::query("DELETE FROM grades WHERE id = $1")
        .bind(id)
        .execute(&state.pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::NO_CONTENT)
}
