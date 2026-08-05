use sqlx::{PgPool, Pool, Postgres};
use crate::config::Config;

pub async fn init_db(config: &Config) -> Result<PgPool, Box<dyn std::error::Error>> {
    let pool = Pool::<Postgres>::connect(&config.database_url).await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ
        );
        "#
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'created_at') THEN ALTER TABLE users ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(); END IF; END $$;
        "#
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at') THEN ALTER TABLE users ADD COLUMN updated_at TIMESTAMPTZ; END IF; END $$;
        "#
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at' AND is_nullable = 'NO') THEN ALTER TABLE users ALTER COLUMN updated_at DROP NOT NULL; ALTER TABLE users ALTER COLUMN updated_at DROP DEFAULT; END IF; END $$;
        "#
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS subjects (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ
        );
        "#
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subjects' AND column_name = 'created_at') THEN ALTER TABLE subjects ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(); END IF; END $$;
        "#
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subjects' AND column_name = 'updated_at') THEN ALTER TABLE subjects ADD COLUMN updated_at TIMESTAMPTZ; END IF; END $$;
        "#
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subjects' AND column_name = 'updated_at' AND is_nullable = 'NO') THEN ALTER TABLE subjects ALTER COLUMN updated_at DROP NOT NULL; ALTER TABLE subjects ALTER COLUMN updated_at DROP DEFAULT; END IF; END $$;
        "#
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS grades (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ
        );
        "#
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grades' AND column_name = 'created_at') THEN ALTER TABLE grades ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(); END IF; END $$;
        "#
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grades' AND column_name = 'updated_at') THEN ALTER TABLE grades ADD COLUMN updated_at TIMESTAMPTZ; END IF; END $$;
        "#
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grades' AND column_name = 'updated_at' AND is_nullable = 'NO') THEN ALTER TABLE grades ALTER COLUMN updated_at DROP NOT NULL; ALTER TABLE grades ALTER COLUMN updated_at DROP DEFAULT; END IF; END $$;
        "#
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'grades' AND column_name = 'subject_id'
            ) THEN
                ALTER TABLE grades DROP COLUMN subject_id;
            END IF;
        END $$;
        "#
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS sessions (
            id SERIAL PRIMARY KEY,
            grade_id INTEGER NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
            subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            pin VARCHAR(4) NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            started_at TIMESTAMPTZ DEFAULT NOW(),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ
        );
        "#
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'created_at') THEN ALTER TABLE sessions ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(); END IF; END $$;
        "#
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'updated_at') THEN ALTER TABLE sessions ADD COLUMN updated_at TIMESTAMPTZ; END IF; END $$;
        "#
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'updated_at' AND is_nullable = 'NO') THEN ALTER TABLE sessions ALTER COLUMN updated_at DROP NOT NULL; ALTER TABLE sessions ALTER COLUMN updated_at DROP DEFAULT; END IF; END $$;
        "#
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'subject_id') THEN ALTER TABLE sessions ADD COLUMN subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE; END IF; END $$;
        "#
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'title') THEN ALTER TABLE sessions ADD COLUMN title VARCHAR(255) NOT NULL DEFAULT 'Sesión sin título'; END IF; END $$;
        "#
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'started_at') THEN ALTER TABLE sessions ADD COLUMN started_at TIMESTAMPTZ DEFAULT NOW(); END IF; END $$;
        "#
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS shared_files (
            id SERIAL PRIMARY KEY,
            session_id INTEGER REFERENCES sessions(id) ON DELETE SET NULL,
            grade_id INTEGER REFERENCES grades(id) ON DELETE CASCADE,
            filename VARCHAR(255) NOT NULL,
            file_path TEXT NOT NULL,
            file_size BIGINT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ
        );
        "#
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shared_files' AND column_name = 'created_at') THEN ALTER TABLE shared_files ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(); END IF; END $$;
        "#
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shared_files' AND column_name = 'updated_at') THEN ALTER TABLE shared_files ADD COLUMN updated_at TIMESTAMPTZ; END IF; END $$;
        "#
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shared_files' AND column_name = 'updated_at' AND is_nullable = 'NO') THEN ALTER TABLE shared_files ALTER COLUMN updated_at DROP NOT NULL; ALTER TABLE shared_files ALTER COLUMN updated_at DROP DEFAULT; END IF; END $$;
        "#
    )
    .execute(&pool)
    .await?;

    sqlx::query(
        r#"
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'shared_files' AND column_name = 'session_id'
            ) THEN
                ALTER TABLE shared_files ADD COLUMN session_id INTEGER REFERENCES sessions(id) ON DELETE SET NULL;
            END IF;
        END $$;
        "#
    )
    .execute(&pool)
    .await?;

    let admin_exists: Option<(i32,)> = sqlx::query_as("SELECT id FROM users WHERE username = $1")
        .bind(&config.admin_username)
        .fetch_optional(&pool)
        .await?;

    if admin_exists.is_none() {
        let hashed_password = bcrypt::hash(&config.admin_password, bcrypt::DEFAULT_COST)?;
        sqlx::query("INSERT INTO users (username, password_hash) VALUES ($1, $2)")
            .bind(&config.admin_username)
            .bind(hashed_password)
            .execute(&pool)
            .await?;
        println!("--> Seed Admin User created: {}", config.admin_username);
    }

    Ok(pool)
}
