# Notary

A modern note-taking application built with **Quarkus** (Java 17), **Panache ORM**, **PostgreSQL**, and a **React** UI with **Vite** and **Mantine**.

## Project Structure

```
Notary/
├── pom.xml                                    # Maven configuration with Java 17 and Quarkus
├── src/
│   └── main/
│       ├── java/com/notary/
│       │   ├── entity/
│       │   │   ├── BaseEntity.java            # Base class with UUID id and timestamps
│       │   │   ├── User.java                  # User entity
│       │   │   └── Note.java                  # Note (text blob) entity
│       │   └── resource/
│       │       ├── UserResource.java          # REST endpoints for users
│       │       └── NoteResource.java          # REST endpoints for notes
│       └── resources/
│           ├── application.properties         # Quarkus config (DB, Flyway, OpenAPI)
│           └── db/migration/
│               └── V1.0.0__create_users_and_notes.sql  # Flyway schema
├── ui/                                        # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx                            # Main React component
│   │   ├── main.jsx                           # React entry point
│   │   └── index.css                          # Styles
│   ├── vite.config.js                         # Vite configuration
│   ├── index.html                             # HTML template
│   └── package.json                           # Node dependencies
└── README.md
```

## Prerequisites

- **Java 17** (JDK)
- **Maven 3.8+**
- **Node.js 16+** and **npm**
- **PostgreSQL** running locally (or configure DB connection)

## Getting Started

### 1. Database Setup

Create the PostgreSQL database and user:

```sql
CREATE USER bob WITH PASSWORD 'bob';
CREATE DATABASE bob OWNER bob;
GRANT ALL PRIVILEGES ON DATABASE bob TO bob;
```

### 2. Backend Setup (Quarkus)

```bash
# Build the project
mvn clean package

# Run in development mode (with live reload)
mvn quarkus:dev
```

The backend will run on `http://localhost:8080`.

Flyway will automatically create the schema on startup.

### 3. Frontend Setup (React + Vite)

```bash
cd ui

# Install dependencies
npm install

# Run development server
npm run dev
```

The frontend will run on `http://localhost:3000` and proxy API calls to the backend.

## Database Schema

### `users` Table
- `id` (UUID, primary key)
- `name` (VARCHAR 255, required)
- `email` (VARCHAR 320, unique, required)
- `password_hash` (VARCHAR 255, BCrypt hashed, never returned in API responses)
- `created_at` (TIMESTAMP, set on insert)
- `updated_at` (TIMESTAMP, auto-updated on modification)

### `notes` Table
- `id` (UUID, primary key)
- `owner_id` (UUID, foreign key → users.id, ON DELETE CASCADE)
- `content` (VARCHAR 10485760, max PostgreSQL VARCHAR length)
- `created_at` (TIMESTAMP, set on insert)
- `updated_at` (TIMESTAMP, auto-updated on modification)

Indexed on `owner_id` for efficient owner-based queries.

## API Endpoints

### Users

- `GET /api/users` – List all users
- `GET /api/users/{id}` – Get a specific user (by UUID)
- `POST /api/users` – Create a new user
  - **Request body:** `{ "name": "...", "email": "...", "password": "..." }`
  - **Response:** User object (password hash is not returned)
- `PUT /api/users/{id}` – Update a user (all fields optional)
  - **Request body:** `{ "name": "...", "email": "...", "password": "..." }`
- `DELETE /api/users/{id}` – Delete a user (cascades to owned notes)

### Notes

- `GET /api/notes` – List all notes
- `GET /api/notes?ownerId={uuid}` – List notes by owner
- `GET /api/notes/{id}` – Get a specific note (by UUID)
- `POST /api/notes` – Create a new note
  - **Request body:** `{ "ownerId": "...", "content": "..." }`
  - **Response:** Note object with id and timestamps
- `PUT /api/notes/{id}` – Update a note (only content is updatable)
  - **Request body:** `{ "content": "..." }`
- `DELETE /api/notes/{id}` – Delete a note

## OpenAPI Documentation

When the backend is running (`mvn quarkus:dev`), you can access the API documentation:

- **OpenAPI Spec (YAML):** http://localhost:8080/q/openapi
- **OpenAPI Spec (JSON):** http://localhost:8080/q/openapi?format=json
- **Swagger UI (Interactive):** http://localhost:8080/q/swagger-ui

The interactive Swagger UI allows you to test all endpoints directly from your browser.

## Building for Production

### Build Frontend

```bash
cd ui
npm run build
cd ..
```

This outputs the compiled UI to `src/main/resources/META-INF/resources/`, which Quarkus will serve.

### Build Backend

```bash
mvn clean package -DskipTests
```

The JAR will be in `target/`.

## Technologies Used

### Backend
- **Quarkus** 3.4.3
- **Java** 17
- **Hibernate Panache** (ORM)
- **PostgreSQL** JDBC driver
- **Flyway** (schema migrations)
- **BCrypt** (password hashing via Quarkus Elytron)
- **SmallRye OpenAPI** (OpenAPI 3.0 + Swagger UI)

### Frontend
- **React** 18
- **Vite** 5
- **Mantine** 7 (UI components)
- **Tabler Icons** (icon library)

## Development

### Tips

- **Quarkus Dev Mode:** Changes to Java code are hot-reloaded automatically
- **Frontend Dev Mode:** Changes to React code are hot-reloaded by Vite
- **Database Migrations:** Flyway runs automatically on startup; add new migrations to `src/main/resources/db/migration/` with naming `V{version}__{description}.sql`
- **API Testing:** Use Swagger UI at `/q/swagger-ui` or tools like Postman/curl

## License

MIT
