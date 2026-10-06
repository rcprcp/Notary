package com.notary.resource;

import com.notary.entity.User;
import io.quarkus.elytron.security.common.BcryptUtil;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
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

    /** Request body for create/update. For update, every field is optional. */
    public record UserRequest(String name, String email, String password, String themeColor) {}

    /** Request body for login. */
    public record LoginRequest(String email, String password) {}

    @GET
    public List<User> list() {
        return User.listAll();
    }

    @GET
    @Path("/{id}")
    public Response get(@PathParam("id") UUID id) {
        User user = User.findById(id);
        return user == null ? Response.status(Response.Status.NOT_FOUND).build() : Response.ok(user).build();
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
        return Response.ok(user).build();
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

    @PUT
    @Path("/{id}")
    @Transactional
    public Response update(@PathParam("id") UUID id, UserRequest req) {
        User user = User.findById(id);
        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        if (req == null) {
            return Response.status(Response.Status.BAD_REQUEST).build();
        }
        if (!isBlank(req.themeColor()) && !THEME_COLORS.contains(req.themeColor())) {
            return Response.status(Response.Status.BAD_REQUEST).entity("invalid themeColor").build();
        }
        if (!isBlank(req.name()) && !req.name().equals(user.name)) {
            if (User.findByName(req.name()) != null) {
                return Response.status(Response.Status.CONFLICT).entity("name already in use").build();
            }
            user.name = req.name();
        }
        if (!isBlank(req.email()) && !req.email().equals(user.email)) {
            if (User.findByEmail(req.email()) != null) {
                return Response.status(Response.Status.CONFLICT).entity("email already in use").build();
            }
            user.email = req.email();
        }
        if (!isBlank(req.password())) {
            user.passwordHash = BcryptUtil.bcryptHash(req.password());
        }
        if (!isBlank(req.themeColor())) {
            user.themeColor = req.themeColor();
        }
        return Response.ok(user).build();
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public Response delete(@PathParam("id") UUID id) {
        return User.deleteById(id)
                ? Response.noContent().build()
                : Response.status(Response.Status.NOT_FOUND).build();
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
