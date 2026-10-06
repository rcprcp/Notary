package com.notary.resource;

import com.notary.entity.Note;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.time.LocalDateTime;
import java.util.List;

@Path("/api/notes")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class NoteResource {

    @GET
    public List<Note> getAllNotes() {
        return Note.listAll();
    }

    @GET
    @Path("/{id}")
    public Response getNoteById(@PathParam("id") Long id) {
        Note note = Note.findById(id);
        if (note == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(note).build();
    }

    @POST
    @Transactional
    public Response createNote(Note note) {
        if (note.title == null || note.title.trim().isEmpty()) {
            return Response.status(Response.Status.BAD_REQUEST).entity("Title is required").build();
        }
        note.createdAt = LocalDateTime.now();
        note.updatedAt = LocalDateTime.now();
        note.persist();
        return Response.status(Response.Status.CREATED).entity(note).build();
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public Response updateNote(@PathParam("id") Long id, Note updatedNote) {
        Note note = Note.findById(id);
        if (note == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        if (updatedNote.title != null) {
            note.title = updatedNote.title;
        }
        if (updatedNote.content != null) {
            note.content = updatedNote.content;
        }
        if (updatedNote.author != null) {
            note.author = updatedNote.author;
        }
        note.updatedAt = LocalDateTime.now();
        note.persist();
        return Response.ok(note).build();
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public Response deleteNote(@PathParam("id") Long id) {
        Note note = Note.findById(id);
        if (note == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        note.delete();
        return Response.status(Response.Status.NO_CONTENT).build();
    }
}