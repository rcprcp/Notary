# Notary

A modern note-taking application built with **Quarkus** (Java 17), **Panache ORM**, **PostgreSQL**, and a **React** UI with **Vite** and **Mantine**.

## Project Structure

```
Notary/
├── pom.xml                          # Maven configuration with Java 17 and Quarkus
├── src/
│   └── main/
│       ├── java/com/notary/         # Java backend code
│       │   ├── entity/              # JPA entities (Note, BaseEntity)
│       │   ├── resource/            # REST endpoints
│       │   └── NotaryApplication.java
│       └── resources/
│           └── application.properties # Quarkus and DB config
├── ui/                              # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx                  # Main React component
│   │   ├── main.jsx                 # React entry point
│   │   └── index.css                # Styles
│   ├── vite.config.js               # Vite configuration
│   ├── index.html                   # HTML template
│   └── package.json                 # Node dependencies
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

### 3. Frontend Setup (React + Vite)

```bash
cd ui

# Install dependencies
npm install

# Run development server
npm run dev
```

The frontend will run on `http://localhost:3000` and proxy API calls to the backend.

## API Endpoints

- `GET /api/notes` - List all notes
- `GET /api/notes/{id}` - Get a specific note
- `POST /api/notes` - Create a new note
- `PUT /api/notes/{id}` - Update a note
- `DELETE /api/notes/{id}` - Delete a note

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

- **Backend**: Quarkus 3.4.3, Java 17, Hibernate Panache
- **Database**: PostgreSQL
- **Frontend**: React 18, Vite 5, Mantine 7, Tabler Icons

## License

MIT