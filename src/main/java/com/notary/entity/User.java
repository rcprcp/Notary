package com.notary.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class User extends BaseEntity {

    @Column(name = "name", nullable = false)
    public String name;

    @Column(name = "email", nullable = false, unique = true, length = 320)
    public String email;

    @JsonIgnore
    @Column(name = "password_hash", nullable = false)
    public String passwordHash;

    public static User findByEmail(String email) {
        return find("email", email).firstResult();
    }
}
