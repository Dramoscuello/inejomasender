# InejomaSender

InejomaSender es una aplicación cliente-servidor diseñada para redes locales que permite a los profesores compartir materiales y archivos en tiempo real con sus estudiantes de manera ágil y controlada, sin depender de conexiones a internet externas.

## 🚀 Características Principales

*   **Sin conexión externa requerida:** Funciona en una red de área local (LAN).
*   **Gestión de Grados y Asignaturas:** Administración de cursos para mantener los archivos organizados.
*   **Sesiones Dinámicas por PIN:** Acceso de estudiantes mediante un PIN alfanumérico temporal de 4 caracteres.
*   **Persistencia Inteligente:** Los archivos se asocian al *Grado*. Si se inicia una nueva sesión para el mismo grado (por ejemplo, para un grupo diferente de estudiantes), los archivos previamente enviados seguirán disponibles.
*   **Tiempo Real:** Actualizaciones instantáneas vía WebSockets. Los estudiantes ven cuando un archivo está disponible al instante y el administrador puede ver el número de estudiantes conectados a la sesión.
*   **Descarga Flexible:** Descarga individual de archivos o descarga masiva mediante un archivo `.zip`.
*   **Transferencia sin Límites:** Capacidad para enviar y recibir archivos de cualquier formato y sin restricciones de tamaño.

## 🛠️ Stack Tecnológico

*   **Backend:** Rust + Axum (Alta concurrencia y seguridad).
*   **Frontend:** ReactJS (Interfaz dinámica y reactiva).
*   **Base de Datos:** PostgreSQL (Almacenamiento relacional para configuración, usuarios, grados y rutas de archivos).
*   **Tiempo Real:** WebSockets (para eventos como "archivo subido", "cierre de sesión", "contador de conexiones").
*   **Despliegue:** Docker y Docker Compose para fácil instalación, pero con soporte nativo para correr los binarios directamente en servidores Debian.

## 👥 Flujo de Usuario

### Modo Administrador (Profesor)
1.  **Autenticación:** Inicia sesión en `/login` usando credenciales definidas previamente (JWT válido por 12 horas).
2.  **Preparación:** Crea *Asignaturas* y *Grados*.
3.  **Inicio de Sesión de Clase:** Selecciona un Grado y activa una sesión. Esto genera un **PIN de 4 caracteres** aleatorios (letras mayúsculas/minúsculas y números).
4.  **Panel de Control:**
    *   Visualiza en tiempo real la **cantidad de estudiantes conectados**.
    *   Sube archivos sin límite de peso o formato. Estos archivos quedan ligados al Grado.
5.  **Cierre:** Al finalizar, cierra la sesión. El PIN expira, pero los archivos se mantienen para futuras sesiones de ese mismo Grado.

### Modo Estudiante
1.  **Ingreso:** El estudiante accede a la IP del servidor en la raíz `/`.
2.  **Conexión:** Ingresa el PIN temporal provisto por el profesor.
3.  **Recepción:** Entra a una sala de espera en tiempo real. 
    *   Ve los archivos que el profesor ya haya subido para ese grado.
    *   Ve en vivo (sin recargar la página) cuando el profesor envía un archivo nuevo.
4.  **Descarga:** Puede descargar el material de forma unitaria o empaquetado en un archivo `.zip`.
5.  **Desconexión:** Si el profesor finaliza la sesión, el estudiante recibe un mensaje flotante y es redirigido automáticamente a la vista de ingreso del PIN.

## ⚙️ Variables de Entorno (.env)

El proyecto incluye un comando de *seeding* o configuración inicial que crea al usuario administrador en la base de datos a partir del archivo `.env`.

```env
DATABASE_URL=postgres://user:password@localhost:5432/inejomasender
ADMIN_USERNAME=admin
ADMIN_PASSWORD=password_seguro
JWT_SECRET=super_secret_key
PORT=3000
```

## 📦 Despliegue y Ejecución

El proyecto está preparado para funcionar de dos maneras en tu servidor local:

**Opción 1: Docker (Recomendado para producción fácil)**
```bash
docker-compose up -d --build
```
Esto levantará la base de datos PostgreSQL, el backend en Rust y servirá los estáticos de React automáticamente.

**Opción 2: Ejecución Local Nativa (Debian / Desarrollo sin Docker)**
1. Levantar una base de datos PostgreSQL localmente.
2. Ejecutar el backend: `cargo run --release`
3. Ejecutar el frontend: `cd frontend && npm install && npm run build` (El servidor de Rust puede servir esta carpeta estática `dist/` o usarse Node.js).
