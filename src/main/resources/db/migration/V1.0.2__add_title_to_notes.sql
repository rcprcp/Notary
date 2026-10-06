-- Notes get a title in addition to their content.
ALTER TABLE notes
    ADD COLUMN title VARCHAR(255) NOT NULL DEFAULT '';
