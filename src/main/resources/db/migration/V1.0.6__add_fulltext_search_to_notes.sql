-- Full-text search support for notes.
-- Generated tsvector columns are maintained automatically by PostgreSQL.
-- Content is truncated to 500,000 characters for indexing because a tsvector is limited to 1MB.
ALTER TABLE notes
    ADD COLUMN title_tsv tsvector
    GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, ''))) STORED;

ALTER TABLE notes
    ADD COLUMN content_tsv tsvector
    GENERATED ALWAYS AS (to_tsvector('english', left(coalesce(content, ''), 500000))) STORED;

CREATE INDEX idx_notes_title_tsv ON notes USING GIN (title_tsv);
CREATE INDEX idx_notes_content_tsv ON notes USING GIN (content_tsv);
