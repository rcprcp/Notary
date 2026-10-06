-- Users
CREATE TABLE users (
    id            UUID                     PRIMARY KEY,
    name          VARCHAR(255)             NOT NULL,
    email         VARCHAR(320)             NOT NULL UNIQUE,
    password_hash VARCHAR(255)             NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Notes (text blobs). 10485760 is the maximum length PostgreSQL allows for VARCHAR(n).
CREATE TABLE notes (
    id         UUID                     PRIMARY KEY,
    owner_id   UUID                     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    content    VARCHAR(10485760)        NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_notes_owner_id ON notes (owner_id);
