package com.notary.resource;

import com.notary.entity.Note;
import com.notary.entity.User;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.net.URI;
import java.util.UUID;

@Path("/api/notes")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class NoteResource {

    /**
     * Request body. ownerId is required on create and ignored on update.
     * On update, title and content are each optional; only provided fields change.
     */
    public record NoteRequest(UUID ownerId, String title, String content) {}

    /** List one user's notes (by user UUID), newest first. ownerId is required. */
    @GET
    public Response list(@QueryParam("ownerId") UUID ownerId) {
        if (ownerId == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("ownerId is required").build();
        }
        return Response.ok(Note.findByOwner(ownerId)).build();
    }

    @GET
    @Path("/{id}")
    public Response get(@PathParam("id") UUID id) {
        Note note = Note.findById(id);
        return note == null ? Response.status(Response.Status.NOT_FOUND).build() : Response.ok(note).build();
    }

    @POST
    @Transactional
    public Response create(NoteRequest req) {
        if (req == null || req.ownerId() == null || req.content() == null
                || req.title() == null || req.title().isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("ownerId, title and content are required").build();
        }
        if (User.findById(req.ownerId()) == null) {
            return Response.status(Response.Status.BAD_REQUEST).entity("owner does not exist").build();
        }
        Note note = new Note();
        note.ownerId = req.ownerId();
        note.title = req.title().trim();
        note.content = req.content();
        note.persist();
        return Response.created(URI.create("/api/notes/" + note.id)).entity(note).build();
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public Response update(@PathParam("id") UUID id, NoteRequest req) {
        Note note = Note.findById(id);
        if (note == null) {
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
        return Note.deleteById(id)
                ? Response.noContent().build()
                : Response.status(Response.Status.NOT_FOUND).build();
    }
}
