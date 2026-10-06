package com.notary.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "notes")
public class Note extends BaseEntity {
    @Column(name = "title", nullable = false)
    public String title;

    @Column(name = "content", columnDefinition = "TEXT")
    public String content;

    @Column(name = "author")
    public String author;

    public Note() {
    }

    public Note(String title, String content, String author) {
        super();
        this.title = title;
        this.content = content;
        this.author = author;
    }
}