package com.notary.entity;

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

    /** Text blob; PostgreSQL's maximum VARCHAR length is 10485760. */
    @Column(name = "content", nullable = false, length = 10485760)
    public String content;

    public static List<Note> findByOwner(UUID ownerId) {
        return list("ownerId", ownerId);
    }
}
