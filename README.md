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
│       │   │   ├── User.java                  # User entity with unique name/email, theme_color
│       │   │   └── Note.java                  # Note entity with title and content
│       │   └── resource/
│       │       ├── UserResource.java          # REST endpoints for users (CRUD)
│       │       └── NoteResource.java          # REST endpoints for notes (CRUD)
│       └── resources/
│           ├── application.properties         # Quarkus config (DB, Flyway, OpenAPI)
│           └── db/migration/
│               ├── V1.0.0__create_users_and_notes.sql
│               ├── V1.0.1__add_theme_color_to_users.sql
│               └── V1.0.2__add_title_to_notes.sql
├── ui/                                        # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx                            # Main app shell with routing
│   │   ├── main.jsx                           # React entry point
│   │   ├── api.js                             # Fetch wrapper for REST API
│   │   ├── UsersPanel.jsx                     # User management UI
│   │   ├── NotesPanel.jsx                     # Note management UI
│   │   ├── CurrentUserSelect.jsx              # User selection dropdown
│   │   ├── ThemeButton.jsx                    # Theme color picker
│   │   ├── OpenApiButton.jsx                  # OpenAPI spec viewer
│   │   └── index.css                          # Styles
│   ├── vite.config.js                         # Vite configuration
│   ├── index.html                             # HTML template
│   └── package.json                           # Node dependencies
└── README.md
```

## Prerequisites

- **Java 17** (JDK)
- **Maven 3.8+**
- **Node.js 18+** and **npm**
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
# Run in development mode (with live reload)
mvn quarkus:dev
```

The backend will run on `http://localhost:8080`.

Flyway will automatically create/migrate the schema on startup.

### 3. Frontend Setup (React + Vite)

In a separate terminal:

```bash
cd ui

# Install dependencies
npm install

# Run development server (with hot reload)
npm run dev
```

The frontend dev server will run on `http://localhost:3000` and proxy API calls to the backend.

### 4. Access the Application

Open your browser to **`http://localhost:3000`**.

## Database Schema

### `users` Table
- `id` (UUID, primary key)
- `name` (VARCHAR 255, unique, required)
- `email` (VARCHAR 320, unique, required)
- `password_hash` (VARCHAR 255, BCrypt hashed, never returned in API responses)
- `theme_color` (VARCHAR 32, Mantine color name, default: `'blue'`)
- `created_at` (TIMESTAMP, set on insert)
- `updated_at` (TIMESTAMP, auto-updated on modification)

### `notes` Table
- `id` (UUID, primary key)
- `owner_id` (UUID, foreign key → users.id, ON DELETE CASCADE)
- `title` (VARCHAR 255, required)
- `content` (VARCHAR 10485760, max PostgreSQL VARCHAR length)
- `created_at` (TIMESTAMP, set on insert)
- `updated_at` (TIMESTAMP, auto-updated on modification)

Indexed on `owner_id` for efficient owner-based queries.

## API Endpoints

### Users

- `GET /api/users` – List all users
- `GET /api/users/{id}` – Get a specific user by UUID
- `POST /api/users` – Create a new user
  - **Request body:** `{ "name": "...", "email": "...", "password": "...", "themeColor": "..." }`
  - **Response:** User object (password hash is not returned, theme is included)
  - Returns 409 if name or email is already in use
- `PUT /api/users/{id}` – Update a user (all fields optional)
  - **Request body:** `{ "name": "...", "email": "...", "password": "...", "themeColor": "..." }`
  - Password and theme are only updated if provided
  - Returns 409 if the new name or email is already in use (but allows keeping the current values)
- `DELETE /api/users/{id}` – Delete a user (cascades to owned notes)

### Notes

- `GET /api/notes?ownerId={uuid}` – List one user's notes by owner UUID (ownerId required; returns 400 if omitted)
  - Notes are sorted by `createdAt` descending (newest first)
- `GET /api/notes/{id}` – Get a specific note by UUID
- `POST /api/notes` – Create a new note
  - **Request body:** `{ "ownerId": "...", "title": "...", "content": "..." }`
  - **Response:** Note object with id and timestamps
  - Title is required and must not be blank
- `PUT /api/notes/{id}` – Update a note (title and/or content)
  - **Request body:** `{ "title": "..." }` or `{ "content": "..." }` or both
  - Only provided fields are updated; at least one is required
  - Title must not be blank
- `DELETE /api/notes/{id}` – Delete a note

## OpenAPI Documentation

When the backend is running (`mvn quarkus:dev`), you can access the API documentation:

- **OpenAPI Spec (YAML):** http://localhost:8080/q/openapi
- **OpenAPI Spec (JSON):** http://localhost:8080/q/openapi?format=json
- **Swagger UI (Interactive):** http://localhost:8080/q/swagger-ui

The interactive Swagger UI allows you to test all endpoints directly from your browser.

## UI Features

### User Management (`/users`)
- **List users:** Table with name, email, ID, created/updated timestamps
- **Create user:** Modal with name, email, password, and confirm password fields
  - Name and email must be unique; returns 409 if a duplicate is detected
  - Password must be entered and confirmed (both fields must match)
  - Shows inline error if name or email is empty
  - Shows modal dialog if a duplicate name or email is detected
- **Edit user:** Update name, email, or password (password is optional for updates)
  - Name and email must still be unique
  - If updating password, both password and confirm password must match
- **Delete user:** Confirmation required; cascades to all notes owned by that user

### Note Management (`/notes`)
- **Select a user:** Dropdown to choose which user's notes to view (required)
  - Defaults to the header's "Acting as" user
  - Only that user's notes are displayed
- **List notes:** Table with Created, Updated, and Title columns (all sortable)
  - Default sort: Created, descending (newest first)
  - Click column headers to sort; click again to reverse direction
  - Content is not shown in the table; click Edit or select a row to view/edit
- **Create note:** Modal with Title and Content fields
  - Title is required and shown in the list
  - Content can be up to ~10MB
- **Edit note:** Select a row to open the note
  - Modal shows both Title and Content
  - Both fields can be edited
  - Only changed fields are sent to the server on update
- **Delete note:** Confirmation shows the note's title

### Theme Selection
- **"Acting as" dropdown:** Select which user you're acting as
  - Required to view and manage notes
  - Theme is persisted to the selected user's record
- **"Theme" button:** Choose from 14 Mantine color palettes
  - Saved to the selected user and restored on page reload

### API Documentation
- **"API description" button:** Displays the OpenAPI spec in a modal

## Building for Production

### Build the UI

```bash
cd ui
npm run build
cd ..
```

Output: `src/main/resources/META-INF/resources/` (consumed by Quarkus)

### Build the Backend

```bash
mvn clean package -DskipTests
```

Output: `target/notary-1.0.0-SNAPSHOT-runner.jar`

### Run the JAR

```bash
java -jar target/notary-1.0.0-SNAPSHOT-runner.jar
```

The app will be available at `http://localhost:8080` with both the backend API and the built UI.

## Development Workflow

### Running in Development Mode

For the best development experience, run the backend and frontend in separate terminals:

**Terminal 1: Backend (Quarkus)**
```bash
mvn quarkus:dev
```
- Runs on `http://localhost:8080`
- Auto-reloads on Java code changes
- Serves the built UI from `src/main/resources/META-INF/resources/`

**Terminal 2: Frontend (Vite)**
```bash
cd ui
npm run dev
```
- Runs on `http://localhost:3000`
- Hot-reloads React code changes instantly
- Proxies `/api` and `/q` requests to the backend

**Access the app at `http://localhost:3000`**

### Development Tips

- **Vite dev mode (recommended):** Run `npm run dev` in the `ui/` folder for hot-reload React changes. The dev server proxies API calls to Quarkus on port 8080, so you don't need to rebuild after every change.
- **Quarkus hot-reload:** Java backend changes are automatically reloaded when running `mvn quarkus:dev`.
- **Database migrations:** Flyway runs automatically on startup. Add new migrations to `src/main/resources/db/migration/` with naming `V{version}__{description}.sql`.
- **OpenAPI updates:** Changes to REST endpoint signatures are reflected in the OpenAPI spec automatically on next Quarkus hot-reload.
- **Theme persistence:** The selected theme is saved to the current user's record in the database. When you select a different user from the "Acting as" dropdown, their saved theme loads from the server.
- **Note sorting:** Notes are sorted by creation time (newest first) by default. Click any column header in the Notes table to sort by that field.

## Technologies Used

### Backend
- **Quarkus** 3.4.3 – lightweight, fast Java framework
- **Java** 17 – language runtime
- **Hibernate Panache** – ORM simplification
- **PostgreSQL** JDBC driver – database connectivity
- **Flyway** – database schema versioning and migration
- **BCrypt** (Quarkus Elytron) – password hashing
- **SmallRye OpenAPI** – automatic OpenAPI 3.0 spec generation and Swagger UI

### Frontend
- **React** 18 – UI library
- **React Router** 6 – client-side routing (HashRouter for SPA)
- **Vite** 5 – fast build tool and dev server
- **Mantine** 7 – UI component library
- **Tabler Icons** – icon library

## License

MIT
