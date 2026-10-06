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
│       │   │   ├── User.java                  # User entity with email, password, theme, superuser flag
│       │   │   └── Note.java                  # Note entity with title and content
│       │   └── resource/
│       │       ├── UserResource.java          # REST endpoints for users (CRUD + login/logout)
│       │       └── NoteResource.java          # REST endpoints for notes (CRUD)
│       └── resources/
│           ├── application.properties         # Quarkus config (DB, Flyway, OpenAPI, sessions)
│           └── db/migration/
│               ├── V1.0.0__create_users_and_notes.sql
│               ├── V1.0.1__add_theme_color_to_users.sql
│               ├── V1.0.2__add_title_to_notes.sql
│               ├── V1.0.3__add_last_login_to_users.sql
│               └── V1.0.4__add_superuser_to_users.sql
├── ui/                                        # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx                            # Main app shell with routing and logout
│   │   ├── main.jsx                           # React entry point with session check
│   │   ├── api.js                             # Fetch wrapper for REST API (includes credentials)
│   │   ├── LoginPage.jsx                      # Login and signup page
│   │   ├── NotesPanel.jsx                     # Note management UI
│   │   ├── ThemeButton.jsx                    # Theme color picker
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

You will see a login page. Create an account or use existing credentials to log in.

## Database Schema

### `users` Table
- `id` (UUID, primary key)
- `name` (VARCHAR 255, unique, required)
- `email` (VARCHAR 320, unique, required)
- `password_hash` (VARCHAR 255, BCrypt hashed, never returned in API responses)
- `theme_color` (VARCHAR 32, Mantine color name, default: `'blue'`)
- `last_login` (TIMESTAMP, nullable, updated on successful login)
- `superuser` (BOOLEAN, default: FALSE, read-only for application, set via psql only)
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

## Authentication & Session Management

### How It Works

1. **Login:** POST `/api/users/login` with email and password sets an HttpOnly, SameSite=Strict session cookie.
2. **Session:** The session cookie is automatically included in all subsequent requests; the server extracts the user ID from the session.
3. **Logout:** POST `/api/users/logout` invalidates the session cookie.
4. **Protected Routes:** All endpoints require authentication. Unauthenticated requests return **401**.

### Session Cookies

- **HttpOnly:** Cannot be accessed by JavaScript; protects against XSS attacks.
- **SameSite=Strict:** Prevents CSRF attacks.
- **Automatic:** Handled by the browser; no manual token management needed.

## Authorization & Access Control

### User Access Rules

- **Regular users** can only view/edit/delete their own account and notes.
- **Superusers** (set via `psql` only) can view/edit/delete any user account and any note.
- **Unauthorized access** returns **404** (not found), not 403, to prevent UUID enumeration.

### Making a User a Superuser

On the database server, use `psql`:

```sql
UPDATE users SET superuser = TRUE WHERE email = 'user@example.com';
```

The user will have full access after their next login.

### Revoking Superuser Status

```sql
UPDATE users SET superuser = FALSE WHERE email = 'user@example.com';
```

**Note:** The `superuser` flag is:
- **Read-only** in the application code (never inserted or updated by the app)
- **Hidden from the UI** (marked with `@JsonIgnore` in the API response)
- **Only visible** in the database and in code logic

## API Endpoints

### Authentication

- `POST /api/users/login` – Authenticate and set session cookie
  - **Request body:** `{ "email": "...", "password": "..." }`
  - **Response:** User object on success (password hash and superuser flag not returned)
  - Returns 400 if email or password is missing
  - Returns 401 if credentials are invalid
  - Sets session cookie on success; updates `last_login` timestamp

- `POST /api/users/logout` – Invalidate session and log out
  - **Request body:** (empty)
  - **Response:** 204 No Content
  - Invalidates the session cookie

- `GET /api/users/me` – Get the current authenticated user
  - **Response:** User object (password hash and superuser flag not returned)
  - Returns 401 if not authenticated

### Users

- `POST /api/users` – Create a new user (public, no authentication required)
  - **Request body:** `{ "name": "...", "email": "...", "password": "..." }`
  - **Response:** User object
  - Returns 400 if any required field is missing
  - Returns 409 if name or email already exists

- `GET /api/users` – List all users (superusers only)
  - **Response:** Array of user objects
  - Returns 401 if not authenticated
  - Returns 403 if caller is not a superuser

- `GET /api/users/{id}` – Get a specific user
  - **Response:** User object
  - Returns 401 if not authenticated
  - Returns 404 if user doesn't exist or caller lacks permission (non-superusers can only view themselves)

- `PUT /api/users/{id}` – Update a user (all fields optional)
  - **Request body:** `{ "name": "...", "email": "...", "password": "...", "themeColor": "..." }`
  - **Response:** Updated user object
  - Returns 401 if not authenticated
  - Returns 404 if user doesn't exist or caller lacks permission
  - Returns 409 if new name or email is already in use
  - Superusers can update any user; regular users can only update themselves

- `DELETE /api/users/{id}` – Delete a user
  - **Response:** 204 No Content
  - Returns 401 if not authenticated
  - Returns 404 if user doesn't exist or caller lacks permission
  - Cascades to all notes owned by that user
  - Superusers can delete any user; regular users can only delete themselves

### Notes

- `GET /api/notes` – List notes
  - **Response:** Array of note objects, sorted by `createdAt` descending
  - Returns 401 if not authenticated
  - Superusers see all notes; regular users see only their own notes

- `GET /api/notes/{id}` – Get a specific note
  - **Response:** Note object
  - Returns 401 if not authenticated
  - Returns 404 if note doesn't exist or caller lacks permission

- `POST /api/notes` – Create a new note
  - **Request body:** `{ "title": "...", "content": "..." }`
  - **Response:** Note object with id and timestamps
  - Returns 401 if not authenticated
  - Returns 400 if title is missing or blank
  - Note is always owned by the authenticated user (ownerId is not accepted in the request)

- `PUT /api/notes/{id}` – Update a note
  - **Request body:** `{ "title": "..." }` or `{ "content": "..." }` or both
  - **Response:** Updated note object
  - Returns 401 if not authenticated
  - Returns 404 if note doesn't exist or caller lacks permission
  - Returns 400 if title is blank
  - Superusers can update any note; regular users can only update their own

- `DELETE /api/notes/{id}` – Delete a note
  - **Response:** 204 No Content
  - Returns 401 if not authenticated
  - Returns 404 if note doesn't exist or caller lacks permission
  - Superusers can delete any note; regular users can only delete their own

## OpenAPI Documentation

When the backend is running (`mvn quarkus:dev`), you can access the API documentation:

- **OpenAPI Spec (YAML):** http://localhost:8080/q/openapi
- **OpenAPI Spec (JSON):** http://localhost:8080/q/openapi?format=json
- **Swagger UI (Interactive):** http://localhost:8080/q/swagger-ui

The interactive Swagger UI allows you to test all endpoints directly from your browser.

## UI Features

### Login & Authentication
- **Login page** – Email and password fields
  - Invalid credentials show an error message
  - Session cookie is set on success
- **Signup** – Create a new account from the login page
  - Name, email, and password fields
  - Password must be confirmed
  - Auto-login after successful signup
- **Logout button** – Clears the session cookie and returns to login page

### Note Management
- **List notes** – Table with Created, Updated, and Title columns (all sortable)
  - Default sort: Created, descending (newest first)
  - Click column headers to sort; click again to reverse direction
- **Create note** – Modal with Title and Content fields
  - Title is required and shown in the list
  - Content can be up to ~10MB
- **Edit note** – Click a row or the Edit button to open the note
  - Modal shows both Title and Content
  - Both fields can be edited
  - Only changed fields are sent to the server on update
- **Delete note** – Confirmation shows the note's title

### Theme Selection
- **"Theme" button** – Choose from 14 Mantine color palettes
  - Saved to the user's account and restored on login

### Superuser Features (if applicable)
- If you are a superuser, `GET /api/notes` returns all notes from all users
- You can view, edit, and delete any user's notes
- You can view and manage all user accounts via API (no UI for user management in this release)

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

- **Vite dev mode (recommended):** Run `npm run dev` in the `ui/` folder for hot-reload React changes. The dev server proxies API calls to Quarkus on port 8080, so you don't need to rebuild after each change.
- **Quarkus hot-reload:** Java backend changes are automatically reloaded when running `mvn quarkus:dev`.
- **Database migrations:** Flyway runs automatically on startup. Add new migrations to `src/main/resources/db/migration/` with naming `V{version}__{description}.sql`.
- **OpenAPI updates:** Changes to REST endpoint signatures are reflected in the OpenAPI spec automatically on next Quarkus hot-reload.
- **Theme persistence:** The selected theme is saved to your user record in the database and restored on login.
- **Note sorting:** Notes are sorted by creation time (newest first) by default. Click any column header in the Notes table to sort by that field.
- **Login tracking:** Each successful login via `POST /api/users/login` updates the user's `last_login` timestamp.
- **Session security:** Session cookies are HttpOnly and SameSite=Strict; the browser handles them automatically.

## Technologies Used

### Backend
- **Quarkus** 3.4.3 – lightweight, fast Java framework
- **Java** 17 – language runtime
- **Hibernate Panache** – ORM simplification
- **PostgreSQL** JDBC driver – database connectivity
- **Flyway** – database schema versioning and migration
- **BCrypt** (Quarkus Elytron) – password hashing and verification
- **SmallRye OpenAPI** – automatic OpenAPI 3.0 spec generation and Swagger UI

### Frontend
- **React** 18 – UI library
- **React Router** 6 – client-side routing (HashRouter for SPA)
- **Vite** 5 – fast build tool and dev server
- **Mantine** 7 – UI component library
- **Tabler Icons** – icon library

## License

Apache 2.0
