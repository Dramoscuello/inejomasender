use axum::{
    extract::{Multipart, Path, State},
    http::{header, HeaderMap, StatusCode},
    response::IntoResponse,
    Json,
};
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::Path as StdPath;
use zip::write::SimpleFileOptions;
use zip::ZipWriter;
use crate::models::{AppState, Session, SharedFile};
use crate::auth::AuthenticatedUser;

pub async fn delete_file(
    _user: AuthenticatedUser,
    State(state): State<AppState>,
    Path(file_id): Path<i32>,
) -> Result<StatusCode, (StatusCode, String)> {
    let record: Option<SharedFile> = sqlx::query_as("SELECT * FROM shared_files WHERE id = $1")
        .bind(file_id)
        .fetch_optional(&state.pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let record = record.ok_or((StatusCode::NOT_FOUND, "File not found".to_string()))?;

    let _ = std::fs::remove_file(&record.file_path);

    sqlx::query("DELETE FROM shared_files WHERE id = $1")
        .bind(file_id)
        .execute(&state.pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn upload_file(
    _user: AuthenticatedUser,
    State(state): State<AppState>,
    mut multipart: Multipart,
) -> Result<Json<SharedFile>, (StatusCode, String)> {
    let mut grade_id: Option<i32> = None;
    let mut session_id: Option<i32> = None;
    let mut filename: Option<String> = None;
    let mut file_bytes: Option<Vec<u8>> = None;

    while let Some(field) = multipart.next_field().await.map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))? {
        let name = field.name().unwrap_or("").to_string();
        if name == "grade_id" {
            let text = field.text().await.map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))?;
            grade_id = text.parse().ok();
        } else if name == "session_id" {
            let text = field.text().await.map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))?;
            session_id = text.parse().ok();
        } else if name == "file" {
            filename = field.file_name().map(|s| s.to_string());
            file_bytes = Some(field.bytes().await.map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))?.to_vec());
        }
    }

    let grade_id = grade_id.ok_or((StatusCode::BAD_REQUEST, "Missing grade_id".to_string()))?;
    let filename = filename.ok_or((StatusCode::BAD_REQUEST, "Missing file".to_string()))?;
    let bytes = file_bytes.ok_or((StatusCode::BAD_REQUEST, "Empty file".to_string()))?;
    let file_size = bytes.len() as i64;

    let upload_dir = "./uploads";
    fs::create_dir_all(upload_dir).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    
    let safe_filename = format!("{}_{}", grade_id, filename);
    let target_path = format!("{}/{}", upload_dir, safe_filename);

    fs::write(&target_path, &bytes).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let shared_file: SharedFile = sqlx::query_as(
        "INSERT INTO shared_files (session_id, grade_id, filename, file_path, file_size) VALUES ($1, $2, $3, $4, $5) RETURNING *"
    )
    .bind(session_id)
    .bind(grade_id)
    .bind(&filename)
    .bind(&target_path)
    .bind(file_size)
    .fetch_one(&state.pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(shared_file))
}

pub async fn list_session_files(
    State(state): State<AppState>,
    Path(pin): Path<String>,
) -> Result<Json<Vec<SharedFile>>, (StatusCode, String)> {
    let session: Option<Session> = sqlx::query_as(
        "SELECT * FROM sessions WHERE pin = $1 AND is_active = TRUE"
    )
    .bind(&pin)
    .fetch_optional(&state.pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let session = session.ok_or((StatusCode::NOT_FOUND, "Invalid PIN".to_string()))?;

    let files: Vec<SharedFile> = sqlx::query_as("SELECT * FROM shared_files WHERE grade_id = $1 ORDER BY id DESC")
        .bind(session.grade_id)
        .fetch_all(&state.pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(files))
}

pub async fn download_file(
    State(state): State<AppState>,
    Path(file_id): Path<i32>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let file_record: SharedFile = sqlx::query_as("SELECT * FROM shared_files WHERE id = $1")
        .bind(file_id)
        .fetch_one(&state.pool)
        .await
        .map_err(|_| (StatusCode::NOT_FOUND, "File not found".to_string()))?;

    let data = fs::read(&file_record.file_path)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let mut headers = HeaderMap::new();
    headers.insert(header::CONTENT_TYPE, "application/octet-stream".parse().unwrap());
    headers.insert(
        header::CONTENT_DISPOSITION,
        format!("attachment; filename=\"{}\"", file_record.filename).parse().unwrap(),
    );

    Ok((headers, data))
}

pub async fn download_zip(
    State(state): State<AppState>,
    Path(pin): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let session: Option<Session> = sqlx::query_as(
        "SELECT * FROM sessions WHERE pin = $1 AND is_active = TRUE"
    )
    .bind(&pin)
    .fetch_optional(&state.pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let session = session.ok_or((StatusCode::NOT_FOUND, "Invalid PIN".to_string()))?;

    let files: Vec<SharedFile> = sqlx::query_as("SELECT * FROM shared_files WHERE grade_id = $1")
        .bind(session.grade_id)
        .fetch_all(&state.pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let zip_path = format!("./uploads/session_{}.zip", pin);
    let zip_file = File::create(&zip_path).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    let mut zip = ZipWriter::new(zip_file);
    let options = SimpleFileOptions::default();

    for f in files {
        if StdPath::new(&f.file_path).exists() {
            zip.start_file(&f.filename, options).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
            let mut file_content = Vec::new();
            let mut disk_file = File::open(&f.file_path).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
            disk_file.read_to_end(&mut file_content).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
            zip.write_all(&file_content).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        }
    }
    zip.finish().map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let zip_bytes = fs::read(&zip_path).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    let _ = fs::remove_file(&zip_path);

    let mut headers = HeaderMap::new();
    headers.insert(header::CONTENT_TYPE, "application/zip".parse().unwrap());
    headers.insert(
        header::CONTENT_DISPOSITION,
        format!("attachment; filename=\"InejomaSender_Archivos_{}.zip\"", pin).parse().unwrap(),
    );

    Ok((headers, zip_bytes))
}
