-- Move sessions off the users row into a dedicated table so a user may be signed in
-- on multiple devices at the same time. Each row is one active login.
CREATE TABLE sessions (
    token_hash VARCHAR(64)             PRIMARY KEY,
    user_id    UUID                    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_sessions_user_id ON sessions (user_id);
CREATE INDEX idx_sessions_expires_at ON sessions (expires_at);

-- Sessions no longer live on the users row. Dropping the columns also drops their indexes.
ALTER TABLE users
    DROP COLUMN IF EXISTS session_token_hash,
    DROP COLUMN IF EXISTS session_created_at,
    DROP COLUMN IF EXISTS session_expires_at;
