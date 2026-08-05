use std::env;

#[derive(Clone, Debug)]
pub struct Config {
    pub database_url: String,
    pub jwt_secret: String,
    pub admin_username: String,
    pub admin_password: String,
    pub port: u16,
}

impl Config {
    pub fn from_env() -> Self {
        dotenvy::dotenv().ok();

        let database_url = env::var("DATABASE_URL")
            .unwrap_or_else(|_| "postgres://user:password_seguro@localhost:5432/inejomasender".to_string());
        let jwt_secret = env::var("JWT_SECRET")
            .unwrap_or_else(|_| "super_secret_key_change_me_in_production".to_string());
        let admin_username = env::var("ADMIN_USERNAME")
            .unwrap_or_else(|_| "admin".to_string());
        let admin_password = env::var("ADMIN_PASSWORD")
            .unwrap_or_else(|_| "password_seguro".to_string());
        let port = env::var("PORT")
            .ok()
            .and_then(|p| p.parse().ok())
            .unwrap_or(3000);

        Config {
            database_url,
            jwt_secret,
            admin_username,
            admin_password,
            port,
        }
    }
}
