package com.notearray.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/**
 * One active login. The primary key is the SHA-256 hash of the session token; the raw
 * token is never stored. A user may have many rows, i.e. be signed in on many devices.
 */
@Entity
@Table(name = "sessions")
public class Session extends PanacheEntityBase {

    @Id
    @Column(name = "token_hash", length = 64, nullable = false, updatable = false)
    public String tokenHash;

    @Column(name = "user_id", nullable = false, updatable = false)
    public UUID userId;

    @Column(name = "created_at", nullable = false, updatable = false)
    public Instant createdAt;

    @Column(name = "expires_at", nullable = false)
    public Instant expiresAt;

    public static Session findByTokenHash(String tokenHash) {
        return find("tokenHash", tokenHash).firstResult();
    }

    /** Delete every session belonging to a user (e.g. after a password change). */
    public static long deleteByUserId(UUID userId) {
        return delete("userId = ?1", userId);
    }

    /** Delete all expired sessions; returns the number removed. */
    public static long deleteExpired() {
        return delete("expiresAt < ?1", Instant.now());
    }
}
