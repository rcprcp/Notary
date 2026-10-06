-- Add last_login timestamp to users table for tracking login activity.
ALTER TABLE users
    ADD COLUMN last_login TIMESTAMP;
