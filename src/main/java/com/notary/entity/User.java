package com.notary.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class User extends BaseEntity {

    public static final String DEFAULT_THEME_COLOR = "blue";

    @Column(name = "name", nullable = false, unique = true, length = 255)
    public String name;

    @Column(name = "email", nullable = false, unique = true, length = 320)
    public String email;

    @JsonIgnore
    @Column(name = "password_hash", nullable = false)
    public String passwordHash;

    /** Mantine primary color name chosen by the user in the UI. */
    @Column(name = "theme_color", nullable = false, length = 32)
    public String themeColor = DEFAULT_THEME_COLOR;

    public static User findByEmail(String email) {
        return find("email", email).firstResult();
    }

    public static User findByName(String name) {
        return find("name", name).firstResult();
    }
}
