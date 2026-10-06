package com.notary.resource;

import com.notary.entity.Note;
import com.notary.entity.User;
import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.net.URI;
import java.util.List;
import java.util.UUID;

@Path("/api/notes")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class NoteResource {

    @Context
    HttpServletRequest request;

    /** Request body. ownerId is ignored; owner is always the authenticated user. */
    public record NoteRequest(String title, String content) {}

    /** Get the authenticated user from the session. Returns null if not logged in. */
    private User getAuthenticatedUser() {
        HttpSession session = request.getSession(false);
        if (session == null) return null;
        UUID userId = (UUID) session.getAttribute("userId");
        if (userId == null) return null;
        return User.findById(userId);
    }

    /** List authenticated user's notes, newest first. */
    @GET
    public Response list() {
        User user = getAuthenticatedUser();
        if (user == null) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        List<Note> notes = Note.find("ownerId", user.id)
                .sort("createdAt desc")
                .list();
        return Response.ok(notes).build();
    }

    @GET
    @Path("/{id}")
    public Response get(@PathParam("id") UUID id) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        Note note = Note.findById(id);
        if (note == null || !note.ownerId.equals(user.id)) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(note).build();
    }

    @POST
    @Transactional
    public Response create(NoteRequest req) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        if (req == null || req.title() == null || req.content() == null
                || req.title().isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("title and content are required").build();
        }
        Note note = new Note();
        note.ownerId = user.id;
        note.title = req.title().trim();
        note.content = req.content();
        note.persist();
        return Response.created(URI.create("/api/notes/" + note.id)).entity(note).build();
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public Response update(@PathParam("id") UUID id, NoteRequest req) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        Note note = Note.findById(id);
        if (note == null || !note.ownerId.equals(user.id)) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        if (req == null || (req.title() == null && req.content() == null)) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("title or content is required").build();
        }
        if (req.title() != null && req.title().isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST).entity("title must not be blank").build();
        }
        if (req.title() != null) {
            note.title = req.title().trim();
        }
        if (req.content() != null) {
            note.content = req.content();
        }
        return Response.ok(note).build();
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public Response delete(@PathParam("id") UUID id) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        Note note = Note.findById(id);
        if (note == null || !note.ownerId.equals(user.id)) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return note.delete() > 0
                ? Response.noContent().build()
                : Response.status(Response.Status.NOT_FOUND).build();
    }
}
