package com.notearray.entity;

import io.quarkus.panache.common.Sort;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "notes")
public class Note extends BaseEntity {

    @Column(name = "owner_id", nullable = false)
    public UUID ownerId;

    @Column(name = "title", nullable = false, length = 255)
    public String title = "";

    /** Text blob; PostgreSQL's maximum VARCHAR length is 10485760. */
    @Column(name = "content", nullable = false, length = 10485760)
    public String content;

    /** Space-delimited tags; up to 10000 characters. */
    @Column(name = "tags", length = 10000)
    public String tags = "";

    /** Notes of one owner (by user UUID), newest first. */
    public static List<Note> findByOwner(UUID ownerId) {
        return list("ownerId", Sort.descending("createdAt"), ownerId);
    }
}
