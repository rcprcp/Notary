package com.notary.resource;

import com.notary.entity.Note;
import com.notary.entity.User;
import jakarta.inject.Inject;
import jakarta.persistence.Query;
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
import jakarta.ws.rs.QueryParam;
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

    /**
     * Check if caller has permission to access a note.
     * Superusers can access any note; regular users can only access their own.
     */
    private boolean canAccessNote(User caller, Note note) {
        return caller.superuser || note.ownerId.equals(caller.id);
    }

    /**
     * List notes. Superusers see all; regular users see only their own.
     *
     * Optional full-text search:
     *   q              - search text
     *   searchTitles   - search the title (default false)
     *   searchContent  - search the note content (default false)
     * If q is provided, at least one of searchTitles / searchContent must be true (else 400).
     */
    @GET
    @SuppressWarnings("unchecked")
    public Response list(@QueryParam("q") String q,
                         @QueryParam("searchTitles") @jakarta.ws.rs.DefaultValue("false") boolean searchTitles,
                         @QueryParam("searchContent") @jakarta.ws.rs.DefaultValue("false") boolean searchContent) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        boolean hasQuery = q != null && !q.isBlank();
        if (!hasQuery) {
            List<Note> notes;
            if (user.superuser) {
                notes = Note.findAll().sort("createdAt desc").list();
            } else {
                notes = Note.find("ownerId", user.id).sort("createdAt desc").list();
            }
            return Response.ok(notes).build();
        }

        if (!searchTitles && !searchContent) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Select at least one of searchTitles or searchContent").build();
        }

        StringBuilder sql = new StringBuilder("SELECT n.* FROM notes n WHERE (");
        if (searchTitles) {
            sql.append("n.title_tsv @@ plainto_tsquery('english', :q)");
        }
        if (searchContent) {
            if (searchTitles) sql.append(" OR ");
            sql.append("n.content_tsv @@ plainto_tsquery('english', :q)");
        }
        sql.append(")");
        if (!user.superuser) {
            sql.append(" AND n.owner_id = :owner");
        }
        sql.append(" ORDER BY n.created_at DESC");

        Query query = Note.getEntityManager().createNativeQuery(sql.toString(), Note.class);
        query.setParameter("q", q.trim());
        if (!user.superuser) {
            query.setParameter("owner", user.id);
        }
        List<Note> results = query.getResultList();
        return Response.ok(results).build();
    }

    @GET
    @Path("/{id}")
    public Response get(@PathParam("id") UUID id) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        Note note = Note.findById(id);
        if (note == null || !canAccessNote(user, note)) {
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
        if (note == null || !canAccessNote(user, note)) {
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
        if (note == null || !canAccessNote(user, note)) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return note.delete() > 0
                ? Response.noContent().build()
                : Response.status(Response.Status.NOT_FOUND).build();
    }
}
