# AGENTS.md — InejomaSender

## Project overview
- Monorepo: **Rust/Axum backend** (`backend/`) + **React/TypeScript/Vite frontend** (`frontend/`) + **PostgreSQL**
- Stack: Rust edition 2024, Axum 0.8, sqlx 0.9, socketioxide, React 19, React Router v7, Tailwind CSS 3, oxlint
- Deployed via Docker Compose (nginx reverse-proxies `/api/` → backend)

## Commands

### Full stack (Docker)
```bash
docker-compose up -d --build
```

### Backend (`backend/`)
```bash
cargo run --release    # requires PostgreSQL reachable at DATABASE_URL
cargo build --release  # build only
```
- Rust **edition 2024** (requires Rust ≥ 1.85.0)
- `.env` at repo root is auto-loaded by `dotenvy`; local-only (gitignored)

### Frontend (`frontend/`)
```bash
npm install            # first time
npm run dev            # Vite dev server (no /api proxy — see note below)
npm run build          # tsc -b && vite build (typecheck + bundle)
npm run lint           # oxlint
```

## Architecture notes

### Auto-bootstrapping
- Backend creates all tables (`users`, `subjects`, `grades`, `sessions`, `shared_files`) on startup via `CREATE TABLE IF NOT EXISTS`
- Seeds admin user from `ADMIN_USERNAME`/`ADMIN_PASSWORD` env vars if they don't exist — no separate migration tool
- JWT tokens expire after **12 hours**

### Auth boundaries
- **Protected** (require Bearer JWT): all POST routes under `/api/grades`, `/api/subjects`, `/api/sessions/start`, `/api/sessions/end/{id}`, `/api/files/upload`
- **Public** (no auth): `GET /api/grades`, `GET /api/subjects`, `GET /api/sessions/verify/{pin}`, `GET /api/files/session/{pin}`, `GET /api/files/download/{id}`, `GET /api/files/download-zip/{pin}`
- Login at `POST /api/auth/login` — returns JWT

### Files
- Uploads saved to `./uploads/` (backend) / `/app/uploads` (Docker volume)
- Files are associated to a **Grade** (not session), so they persist across sessions
- ZIP download endpoint generates a temp zip, serves it, then deletes it

### WebSockets
- `socketioxide` is a dependency but no WS route is wired in `main.rs` yet — real-time features mentioned in README may be incomplete

### Nginx / Docker networking
- Nginx proxies `/api/` → `http://backend:3000` using Docker internal DNS
- **Local dev gotcha**: Vite dev server has no proxy configured for `/api`; in dev mode the frontend expects the backend running on the same origin or you must add a Vite proxy to `localhost:3000`

## No tests exist
- No test framework configured on either backend or frontend
- No CI pipelines configured

## Routes

### Student
| Path | Component |
|------|-----------|
| `/` | StudentPin |
| `/session/:pin` | StudentWaitingRoom |

### Admin
| Path | Component |
|------|-----------|
| `/login` | AdminLogin |
| `/admin` (layout) | AdminLayout |
| `/admin` (index) | AdminHome |
| `/admin/grades` | AdminGrades |
| `/admin/subjects` | AdminSubjects |
| `/admin/session/:id` | AdminSession |

### API
| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/login` | No |
| GET/POST | `/api/grades` | GET=No, POST=Yes |
| DELETE | `/api/grades/{id}` | Yes |
| GET/POST | `/api/subjects` | GET=No, POST=Yes |
| DELETE | `/api/subjects/{id}` | Yes |
| POST | `/api/sessions/start` | Yes |
| POST | `/api/sessions/end/{id}` | Yes |
| GET | `/api/sessions/verify/{pin}` | No |
| POST | `/api/files/upload` | Yes |
| GET | `/api/files/session/{pin}` | No |
| GET | `/api/files/download/{id}` | No |
| GET | `/api/files/download-zip/{pin}` | No |
