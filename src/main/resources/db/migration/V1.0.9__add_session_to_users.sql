-- Persist login sessions on the users row so sessions survive application restarts.
-- The model is single-session-per-user: a successful login replaces any previous session.
-- Only the SHA-256 hash of the session token is stored, never the raw token, so a
-- leaked database snapshot cannot be replayed as a valid session.
ALTER TABLE users
    ADD COLUMN session_token_hash VARCHAR(64),
    ADD COLUMN session_created_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN session_expires_at TIMESTAMP WITH TIME ZONE;

-- Fast, unique lookup by token hash. Partial so the many signed-out rows (NULL) stay out
-- of the index and multiple NULLs remain allowed.
CREATE UNIQUE INDEX idx_users_session_token_hash
    ON users (session_token_hash)
    WHERE session_token_hash IS NOT NULL;

-- Supports efficient cleanup of expired sessions.
CREATE INDEX idx_users_session_expires_at
    ON users (session_expires_at)
    WHERE session_expires_at IS NOT NULL;
