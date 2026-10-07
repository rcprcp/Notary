# NoteArray

A modern note-taking application built with **Quarkus** (Java 17), **Panache ORM**, **PostgreSQL**, and a **React** UI with **Vite** and **Mantine**. Works great on desktop, tablet, and mobile devices.

## Project Structure

```
NoteArray/
├── pom.xml                                    # Maven configuration with Java 17 and Quarkus
├── src/
│   └── main/
│       ├── java/com/notearray/
│       │   ├── entity/
│       │   │   ├── BaseEntity.java            # Base class with UUID id and timestamps
│       │   │   ├── User.java                  # User entity with unique name/email, theme_color, last_login, superuser flag
│       │   │   └── Note.java                  # Note entity with title, markdown content, and space-delimited tags
│       │   └── resource/
│       │       ├── UserResource.java          # REST endpoints for users (CRUD + login/logout)
│       │       └── NoteResource.java          # REST endpoints for notes (CRUD + search + import)
│       └── resources/
│           ├── application.properties         # Quarkus config (DB, Flyway, OpenAPI, sessions)
│           └── db/migration/
│               ├── V1.0.0__create_users_and_notes.sql
│               ├── V1.0.1__add_theme_color_to_users.sql
│               ├── V1.0.2__add_title_to_notes.sql
│               ├── V1.0.3__add_last_login_to_users.sql
│               ├── V1.0.4__add_superuser_to_users.sql
│               ├── V1.0.5__insert_initial_user.sql
│               ├── V1.0.6__add_fulltext_search_to_notes.sql
│               └── V1.0.7__add_tags_to_notes.sql
├── ui/                                        # React + Vite frontend (mobile-responsive)
│   ├── src/
│   │   ├── App.jsx                            # Main app shell with routing and logout
│   │   ├── main.jsx                           # React entry point with session check
│   │   ├── api.js                             # Fetch wrapper for REST API (includes credentials)
│   │   ├── LoginPage.jsx                      # Login and signup page
│   │   ├── NotesPanel.jsx                     # Note management UI with rich text editor, tags, search, import, auto-save, and responsive design
│   │   ├── ThemeButton.jsx                    # Theme color picker
│   │   └── index.css                          # Mobile-first responsive styles
│   ├── vite.config.js                         # Vite configuration
│   ├── index.html                             # HTML template with viewport meta
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

Flyway will automatically create/migrate the schema on startup and insert an initial test user.

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

Open your browser to **`http://localhost:3000`** (or access on any device on your network).

You will see a login page. Use the initial test user credentials below or create a new account.

### Initial Test User

When the database is first created, an initial test user is automatically inserted:

- **Email:** mickey@mickey.com
- **Password:** mickey
- **Name:** mickey
- **Superuser:** ❌ No (regular user only)

This account has regular user permissions. It can create, view, and manage only its own notes. To give this user superuser access, use `psql`:

```sql
UPDATE users SET superuser = TRUE WHERE email = 'mickey@mickey.com';
```

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
- `content` (TEXT, stores markdown-formatted content, max ~10MB)
- `tags` (VARCHAR 10000, space-delimited tags, default empty)
- `title_tsv` (tsvector, auto-generated full-text search index on title)
- `content_tsv` (tsvector, auto-generated full-text search index on content, truncated to 500KB)
- `created_at` (TIMESTAMP, set on insert)
- `updated_at` (TIMESTAMP, auto-updated on modification)

Indexed on `owner_id` for efficient owner-based queries. GIN indexes on `title_tsv` and `content_tsv` for fast full-text search.

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

### Notes – CRUD

- `GET /api/notes` – List notes
  - **Response:** Array of note objects, sorted by `createdAt` descending
  - Returns 401 if not authenticated
  - Superusers see all notes; regular users see only their own notes

- `GET /api/notes/{id}` – Get a specific note
  - **Response:** Note object
  - Returns 401 if not authenticated
  - Returns 404 if note doesn't exist or caller lacks permission

- `POST /api/notes` – Create a new note
  - **Request body:** `{ "title": "...", "content": "...", "tags": "..." }`
  - **Response:** Note object with id and timestamps
  - Returns 401 if not authenticated
  - Returns 400 if title is missing or blank
  - Content is stored as markdown
  - Tags are space-delimited and optional
  - Note is always owned by the authenticated user (ownerId is not accepted in the request)

- `PUT /api/notes/{id}` – Update a note
  - **Request body:** `{ "title": "..." }` or `{ "content": "..." }` or `{ "tags": "..." }` or any combination
  - **Response:** Updated note object
  - Returns 401 if not authenticated
  - Returns 404 if note doesn't exist or caller lacks permission
  - Returns 400 if title is blank
  - Superusers can update any note; regular users can only update their own
  - Content is stored as markdown
  - Tags are space-delimited

- `DELETE /api/notes/{id}` – Delete a note
  - **Response:** 204 No Content
  - Returns 401 if not authenticated
  - Returns 404 if note doesn't exist or caller lacks permission
  - Superusers can delete any note; regular users can only delete their own

### Notes – Filters
- **GET** `/api/notes` also accepts filter parameters, combined with AND (and with the search above):
  - `tags` – repeatable; a note must have every listed tag
  - `untagged` – `true` to return only notes without tags
  - `pinned` – `true` to return only pinned notes
  - `createdFrom` / `createdTo`, `updatedFrom` / `updatedTo` – ISO-8601 instants (inclusive range); invalid values return 400
- **PUT** `/api/notes/{id}` accepts `{ "pinned": true|false }` to pin or unpin a note

### Notes – Search

- `GET /api/notes?q=...&searchTitles=true&searchContent=true` – Full-text search
  - **Query parameters:**
    - `q` – Search query (required when searching)
    - `searchTitles` – Search in note titles (boolean, default false)
    - `searchContent` – Search in note content (boolean, default false)
  - **Response:** Array of matching note objects, sorted by `createdAt` descending
  - Returns 401 if not authenticated
  - Returns 400 if q is provided but neither searchTitles nor searchContent is true
  - Search is word-based, case-insensitive, and ignores common stop words (like "the")
  - Word endings are normalized (e.g., "running" matches "run")
  - Superusers search all notes; regular users search only their own

### Notes – Import

- `POST /api/notes/import/joplin` – Import from Joplin JEX archive
  - **Content-Type:** `application/octet-stream`
  - **Request body:** Binary .jex file (ZIP archive)
  - **Response:** `{ "imported": N, "errors": N, "messages": [...] }`
  - Returns 401 if not authenticated
  - Returns 400 if file is invalid
  - Flattens Joplin's folder hierarchy into space-delimited tags
  - Automatically tags imported notes with folder names
  - Extracts title from first markdown heading or uses filename
  - Content is stored as markdown

- `POST /api/notes/import/markdown` – Import a single markdown file
  - **Content-Type:** `application/octet-stream`
  - **Request body:** Binary .md file
  - **Response:** Note object
  - Returns 401 if not authenticated
  - Returns 400 if file is invalid
  - Extracts title from first markdown heading or first line
  - Tags imported note with `markdown-import`
  - Content is stored as markdown

## OpenAPI Documentation

When the backend is running (`mvn quarkus:dev`), you can access the API documentation:

- **OpenAPI Spec (YAML):** http://localhost:8080/q/openapi
- **OpenAPI Spec (JSON):** http://localhost:8080/q/openapi?format=json
- **Swagger UI (Interactive):** http://localhost:8080/q/swagger-ui

The interactive Swagger UI allows you to test all endpoints directly from your browser.

## UI Features

### Responsive Design
- **Mobile-first approach** – Works seamlessly on phones, tablets, and desktops
- **Breakpoints:**
  - **Mobile** (<768px) – Optimized for small screens with full-width modals, card view for notes, collapsible filters
  - **Tablet** (768-1024px) – Balanced layout with responsive spacing
  - **Desktop** (>1024px) – Full-featured table view with all columns visible
- **Touch optimization** – 44px minimum touch targets on mobile, better spacing for fingers
- **Mobile features:**
  - Card-based note display (instead of table)
  - Collapsible search filter buttons
  - Full-screen modals for editing
  - Responsive typography with `clamp()` for readability
  - iOS/Android optimizations (no zoom on input, proper keyboard handling)
- **All devices:**
  - Responsive button sizing
  - Adaptive font sizes
  - Touch-friendly form inputs
  - Improved focus states for accessibility

### Login & Authentication
- **Login page** – Email and password fields (responsive)
  - Invalid credentials show an error message
  - Session cookie is set on success
- **Signup** – Create a new account from the login page
  - Name, email, and password fields
  - Password must be confirmed
  - Auto-login after successful signup
- **Logout button** – Clears the session cookie and returns to login page

### Note Management
- **List notes** – Responsive view that adapts to screen size
  - **Desktop:** Table with Created, Updated, and Title columns (all sortable)
  - **Mobile:** Card view with note title, dates, and tags
  - Default sort: Created, descending (newest first)
  - Click column headers (desktop) to sort; click again to reverse direction
  - Tags displayed as badges below each note's title
- **Create note** – Modal with Title, Tags, and Rich Text Editor fields (full-screen on mobile)
  - Title is required and shown in the list
  - Tags are space-delimited (e.g., "joplin important work")
  - Content uses a full-featured markdown editor
  - Auto-save starts after the note is created
- **Edit note** – Click a row or the Edit button to open the note
  - Modal shows Title, Tags, and Rich Text Editor (full-screen on mobile)
  - All fields can be edited with live formatting
  - Only changed fields are sent to the server on update
- **Delete note** – Confirmation shows the note's title

### Tags
- **Tags field** – Space-delimited text input in note editor
  - Multiple tags separated by spaces (no special characters needed)
  - Example: `joplin project-alpha important`
  - Tags displayed as badges in the notes list
  - Useful for organizing and categorizing notes
  - Particularly useful with imported notes (tags preserve folder hierarchy from Joplin)

### Auto-Save
- **Auto-save for existing notes** – Changes saved automatically after 2 seconds of typing inactivity
  - No data loss: all unsaved changes are persisted to the server
  - Status indicators:
    - **"Saving..."** – Request in flight
    - **"✓ Saved at HH:MM:SS"** – Recent successful save with timestamp
    - **"Unsaved changes..."** – Changes pending the 2-second debounce timer
    - **Error message** – Auto-save failed; click "Update" to retry
  - New notes require manual save (click "Create"); auto-save starts after creation
  - Manual "Update" button still available for immediate save anytime
  - Closing the modal flushes any pending changes to prevent data loss
  - Only changed fields are sent to the server (optimized)
- **No data loss guarantee** – In-flight requests complete before modal closes; debounced changes flush before modal closes

### Rich Text Editing with Markdown
- **Formatting toolbar** – Bold, Italic, Underline, Strikethrough, Clear formatting
- **Headings** – H1, H2, H3 support
- **Lists** – Bullet lists and ordered lists
- **Code blocks** – Inline code and multi-line code blocks
- **Links** – Insert and remove links
- **Blockquotes** – Quote formatting
- **Markdown storage** – Content is stored as markdown in the database, so you can use it in any markdown viewer
- **Live preview** – Editor supports TipTap's rich text rendering with markdown shortcuts

### Advanced Filtering
- **Filter panel** – sidebar on desktop, collapsible "Filters" section on mobile
  - Date range (last 7 days, 30 days, or custom range) on modified or created date
  - Multi-select tags filter
  - Smart collections with note counts: Untagged, Pinned, Modified today, Oldest unmodified (30+ days)
- **Active filter badges** with clear buttons, an active filter count, and a "Clear all filters" button
- **Saved searches** – save the current search and filters under a name, re-apply or delete them; stored in browser localStorage together with your last used filters

### Full-Text Search
- **Search bar** – Type your search query
- **Search checkboxes** – Choose where to search
  - **Mobile:** Collapsible "Search Options" button to toggle checkboxes
  - **Desktop:** Always-visible checkboxes
  - **Search Titles** – Match words in note titles
  - **Search Note Content** – Match words in note content
  - Both can be checked together for comprehensive search
- **Search results** – Shows matching notes with result count
- **Smart search** – Word-based, case-insensitive, ignores common words and word endings
- **Help modal** – Click search with no checkboxes to see instructions

### Import Notes
- **Import button** – Upload notes from external sources
- **Joplin JEX import** – Import entire note collections from Joplin
  - Upload .jex files (Joplin's native export format)
  - Preserves folder structure as space-delimited tags
  - Extracts title from markdown headings
  - Shows import progress and results
- **Markdown import** – Import individual markdown files
  - Upload .md files
  - Extracts title from first markdown heading or line
  - Automatically tagged with `markdown-import`
  - Preserves all markdown formatting

### Theme Selection
- **"Theme" button** – Choose from 14 Mantine color palettes
  - Saved to the user's account and restored on login

### Superuser Features (if applicable)
- If you are a superuser, `GET /api/notes` returns all notes from all users
- You can view, edit, and delete any user's notes
- You can search across all users' notes
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

Output: `target/notearray-1.0.0-SNAPSHOT-runner.jar`

### Run the JAR

```bash
java -jar target/notearray-1.0.0-SNAPSHOT-runner.jar
```

The app will be available at `http://localhost:8080` with both the backend API and the built UI.

### Mobile Deployment
- The app is fully responsive and works on mobile devices
- Serve on your network to access from phones/tablets: `http://<your-ip>:3000` (dev) or `http://<your-ip>:8080` (production)
- Test on multiple devices to ensure optimal experience

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

### Testing on Mobile Devices

1. Find your machine's IP address:
   ```bash
   # macOS/Linux
   ifconfig | grep "inet"
   # Windows
   ipconfig
   ```

2. Access from mobile device on the same network:
   ```
   http://<your-ip>:3000  (development)
   http://<your-ip>:8080  (production build)
   ```

3. Use browser DevTools mobile view to test responsive breakpoints

### Development Tips

- **Vite dev mode (recommended):** Run `npm run dev` in the `ui/` folder for hot-reload React changes. The dev server proxies API calls to Quarkus on port 8080, so you don't need to rebuild after each change.
- **Quarkus hot-reload:** Java backend changes are automatically reloaded when running `mvn quarkus:dev`.
- **Database migrations:** Flyway runs automatically on startup. Add new migrations to `src/main/resources/db/migration/` with naming `V{version}__{description}.sql`.
- **OpenAPI updates:** Changes to REST endpoint signatures are reflected in the OpenAPI spec automatically on next Quarkus hot-reload.
- **Theme persistence:** The selected theme is saved to your user record in the database and restored on login.
- **Note sorting:** Notes are sorted by creation time (newest first) by default. Click any column header in the Notes table to sort by that field (desktop only; mobile cards maintain date sort).
- **Login tracking:** Each successful login via `POST /api/users/login` updates the user's `last_login` timestamp.
- **Session security:** Session cookies are HttpOnly and SameSite=Strict; the browser handles them automatically.
- **Markdown in notes:** Content is stored as markdown, so you can export, version control, and sync notes easily.
- **Tags and search:** Tags are space-delimited and searchable via the full-text search feature.
- **Importing notes:** Use the Import feature to migrate notes from Joplin or upload individual markdown files. Imports automatically preserve metadata and convert folder structures to tags.
- **Auto-save behavior:** Changes to existing notes are automatically saved after 2 seconds of inactivity. New notes require manual save first. The debounce delay prevents excessive server requests while providing responsive save behavior. No changes are lost when closing the modal—pending changes are flushed before closing.
- **Responsive design:** Mobile-first CSS approach with breakpoints at 768px and 1024px. Use browser DevTools to test different screen sizes. Touch targets are 44px minimum on mobile for accessibility.
- **Mobile optimization:** Modals go full-screen on mobile, search filters collapse, notes display as cards instead of tables. Font sizes scale with viewport using `clamp()`.

## Technologies Used

### Backend
- **Quarkus** 3.4.3 – lightweight, fast Java framework
- **Java** 17 – language runtime
- **Hibernate Panache** – ORM simplification
- **PostgreSQL** JDBC driver – database connectivity
- **Flyway** – database schema versioning and migration
- **BCrypt** (Quarkus Elytron) – password hashing and verification
- **SmallRye OpenAPI** – automatic OpenAPI 3.0 spec generation and Swagger UI
- **Jackson** – JSON processing for import parsing

### Frontend
- **React** 18 – UI library
- **React Router** 6 – client-side routing (HashRouter for SPA)
- **Vite** 5 – fast build tool and dev server
- **Mantine** 7 – UI component library with hooks for responsive design
- **TipTap** 2 – headless rich text editor with markdown support
- **Tabler Icons** – icon library

## License

Apache 2.0
