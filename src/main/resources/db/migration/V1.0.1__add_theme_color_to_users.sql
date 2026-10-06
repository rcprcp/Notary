-- Per-user UI theme (Mantine primary color name), e.g. 'blue', 'teal'.
ALTER TABLE users
    ADD COLUMN theme_color VARCHAR(32) NOT NULL DEFAULT 'blue';
