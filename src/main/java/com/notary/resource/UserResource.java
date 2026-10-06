package com.notary.resource;

import com.notary.entity.Note;
import com.notary.entity.User;
import io.quarkus.elytron.security.common.BcryptUtil;
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
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Path("/api/users")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UserResource {

    /** Mantine color palettes selectable in the UI. */
    private static final Set<String> THEME_COLORS = Set.of(
            "dark", "gray", "red", "pink", "grape", "violet", "indigo", "blue",
            "cyan", "teal", "green", "lime", "yellow", "orange");

    @Context
    HttpServletRequest request;

    /** Request body for create/update. For update, every field is optional. */
    public record UserRequest(String name, String email, String password, String themeColor) {}

    /** Request body for login. */
    public record LoginRequest(String email, String password) {}

    /** Get the authenticated user from the session. Returns null if not logged in. */
    private User getAuthenticatedUser() {
        HttpSession session = request.getSession(false);
        if (session == null) return null;
        UUID userId = (UUID) session.getAttribute("userId");
        if (userId == null) return null;
        return User.findById(userId);
    }

    @GET
    @Path("/me")
    public Response getCurrentUser() {
        User user = getAuthenticatedUser();
        return user == null ? Response.status(Response.Status.UNAUTHORIZED).build() : Response.ok(user).build();
    }

    @POST
    @Path("/login")
    @Transactional
    public Response login(LoginRequest req) {
        if (req == null || isBlank(req.email()) || isBlank(req.password())) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("email and password are required").build();
        }
        User user = User.findByEmail(req.email());
        if (user == null || !BcryptUtil.matches(req.password(), user.passwordHash)) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity("invalid email or password").build();
        }
        user.lastLogin = Instant.now();
        // Create session and store user ID
        HttpSession session = request.getSession(true);
        session.setAttribute("userId", user.id);
        return Response.ok(user).build();
    }

    @POST
    @Path("/logout")
    public Response logout() {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        return Response.noContent().build();
    }

    @POST
    @Transactional
    public Response create(UserRequest req) {
        if (req == null || isBlank(req.name()) || isBlank(req.email()) || isBlank(req.password())) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("name, email and password are required").build();
        }
        if (!isBlank(req.themeColor()) && !THEME_COLORS.contains(req.themeColor())) {
            return Response.status(Response.Status.BAD_REQUEST).entity("invalid themeColor").build();
        }
        if (User.findByName(req.name()) != null) {
            return Response.status(Response.Status.CONFLICT).entity("name already in use").build();
        }
        if (User.findByEmail(req.email()) != null) {
            return Response.status(Response.Status.CONFLICT).entity("email already in use").build();
        }
        User user = new User();
        user.name = req.name();
        user.email = req.email();
        user.passwordHash = BcryptUtil.bcryptHash(req.password());
        if (!isBlank(req.themeColor())) {
            user.themeColor = req.themeColor();
        }
        user.persist();
        return Response.created(URI.create("/api/users/" + user.id)).entity(user).build();
    }

    @GET
    @Path("/{id}")
    public Response get(@PathParam("id") UUID id) {
        User caller = getAuthenticatedUser();
        if (caller == null) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        // Can only view your own user record
        if (!caller.id.equals(id)) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(caller).build();
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public Response update(@PathParam("id") UUID id, UserRequest req) {
        User caller = getAuthenticatedUser();
        if (caller == null) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        // Can only update your own user record
        if (!caller.id.equals(id)) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        if (req == null) {
            return Response.status(Response.Status.BAD_REQUEST).build();
        }
        if (!isBlank(req.themeColor()) && !THEME_COLORS.contains(req.themeColor())) {
            return Response.status(Response.Status.BAD_REQUEST).entity("invalid themeColor").build();
        }
        if (!isBlank(req.name()) && !req.name().equals(caller.name)) {
            if (User.findByName(req.name()) != null) {
                return Response.status(Response.Status.CONFLICT).entity("name already in use").build();
            }
            caller.name = req.name();
        }
        if (!isBlank(req.email()) && !req.email().equals(caller.email)) {
            if (User.findByEmail(req.email()) != null) {
                return Response.status(Response.Status.CONFLICT).entity("email already in use").build();
            }
            caller.email = req.email();
        }
        if (!isBlank(req.password())) {
            caller.passwordHash = BcryptUtil.bcryptHash(req.password());
        }
        if (!isBlank(req.themeColor())) {
            caller.themeColor = req.themeColor();
        }
        return Response.ok(caller).build();
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public Response delete(@PathParam("id") UUID id) {
        User caller = getAuthenticatedUser();
        if (caller == null) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        // Can only delete your own user record
        if (!caller.id.equals(id)) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return User.deleteById(id)
                ? Response.noContent().build()
                : Response.status(Response.Status.NOT_FOUND).build();
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
