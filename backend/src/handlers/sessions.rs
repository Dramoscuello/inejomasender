use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use rand::RngExt;
use crate::models::{AppState, Session, SessionInfo, StartSessionRequest};
use crate::auth::AuthenticatedUser;

pub async fn list_sessions(
    _user: AuthenticatedUser,
    State(state): State<AppState>,
) -> Result<Json<Vec<SessionInfo>>, (StatusCode, String)> {
    let sessions: Vec<SessionInfo> = sqlx::query_as(
        r#"
        SELECT
            s.id, s.grade_id, g.name as grade_name,
            s.subject_id, sub.name as subject_name,
            s.title, s.pin, s.is_active,
            s.started_at::TEXT as started_at, s.created_at::TEXT as created_at,
            COALESCE(fc.cnt, 0) as file_count
        FROM sessions s
        JOIN grades g ON g.id = s.grade_id
        JOIN subjects sub ON sub.id = s.subject_id
        LEFT JOIN (
            SELECT session_id, COUNT(*) as cnt FROM shared_files GROUP BY session_id
        ) fc ON fc.session_id = s.id
        ORDER BY s.created_at DESC
        "#
    )
    .fetch_all(&state.pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(sessions))
}

pub async fn start_session(
    _user: AuthenticatedUser,
    State(state): State<AppState>,
    Json(payload): Json<StartSessionRequest>,
) -> Result<Json<Session>, (StatusCode, String)> {
    sqlx::query("UPDATE sessions SET is_active = FALSE WHERE grade_id = $1")
        .bind(payload.grade_id)
        .execute(&state.pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let pin: String = {
        let charset = b"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let mut rng = rand::rng();
        (0..4)
            .map(|_| {
                let idx = rng.random_range(0..charset.len());
                charset[idx] as char
            })
            .collect()
    };

    let session: Session = sqlx::query_as(
        "INSERT INTO sessions (grade_id, subject_id, title, pin, is_active) VALUES ($1, $2, $3, $4, TRUE) RETURNING *"
    )
    .bind(payload.grade_id)
    .bind(payload.subject_id)
    .bind(&payload.title)
    .bind(&pin)
    .fetch_one(&state.pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(session))
}

pub async fn end_session(
    _user: AuthenticatedUser,
    State(state): State<AppState>,
    Path(session_id): Path<i32>,
) -> Result<StatusCode, (StatusCode, String)> {
    sqlx::query("UPDATE sessions SET is_active = FALSE, updated_at = NOW() WHERE id = $1")
        .bind(session_id)
        .execute(&state.pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::OK)
}

pub async fn delete_session(
    _user: AuthenticatedUser,
    State(state): State<AppState>,
    Path(session_id): Path<i32>,
) -> Result<StatusCode, (StatusCode, String)> {
    let files: Vec<(String,)> = sqlx::query_as(
        "SELECT file_path FROM shared_files WHERE session_id = $1"
    )
    .bind(session_id)
    .fetch_all(&state.pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    sqlx::query("DELETE FROM shared_files WHERE session_id = $1")
        .bind(session_id)
        .execute(&state.pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    for (path,) in &files {
        let _ = std::fs::remove_file(path);
    }

    sqlx::query("DELETE FROM sessions WHERE id = $1")
        .bind(session_id)
        .execute(&state.pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn verify_pin(
    State(state): State<AppState>,
    Path(pin): Path<String>,
) -> Result<Json<Session>, (StatusCode, String)> {
    let session: Option<Session> = sqlx::query_as(
        "SELECT * FROM sessions WHERE pin = $1 AND is_active = TRUE"
    )
    .bind(&pin)
    .fetch_optional(&state.pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    match session {
        Some(s) => Ok(Json(s)),
        None => Err((StatusCode::NOT_FOUND, "PIN no válido o sesión finalizada".to_string())),
    }
}
