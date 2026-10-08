package com.notearray.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.core.Cookie;
import java.time.Duration;
import java.time.Instant;
import java.util.Iterator;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Server-side login sessions, addressed by an HttpOnly, SameSite=Strict cookie.
 * The token is a random UUID; user ids are only ever stored server side.
 * Sessions live in memory, so restarting the application signs everyone out.
 */
@ApplicationScoped
public class SessionService {

    /** Name of the cookie carrying the session token. */
    public static final String COOKIE_NAME = "NOTEARRAY_SESSION";

    private static final Duration SESSION_TTL = Duration.ofDays(7);

    private record Session(UUID userId, Instant expiresAt) {}

    private final Map<String, Session> sessions = new ConcurrentHashMap<>();

    /** Create a session for the user and return the token to put in the cookie. */
    public String create(UUID userId) {
        purgeExpired();
        String token = UUID.randomUUID().toString();
        sessions.put(token, new Session(userId, Instant.now().plus(SESSION_TTL)));
        return token;
    }

    /** Return the user id bound to the cookie, or null when the cookie is missing, unknown or expired. */
    public UUID resolve(Cookie cookie) {
        String token = token(cookie);
        if (token == null) {
            return null;
        }
        Session session = sessions.get(token);
        if (session == null) {
            return null;
        }
        if (session.expiresAt().isBefore(Instant.now())) {
            sessions.remove(token);
            return null;
        }
        return session.userId();
    }

    /** Drop the session bound to the cookie, if any. */
    public void invalidate(Cookie cookie) {
        String token = token(cookie);
        if (token != null) {
            sessions.remove(token);
        }
    }

    /** Set-Cookie header that hands the token to the browser. */
    public String cookieHeader(String token) {
        return COOKIE_NAME + "=" + token
                + "; Path=/"
                + "; Max-Age=" + SESSION_TTL.toSeconds()
                + "; HttpOnly; SameSite=Strict";
    }

    /** Set-Cookie header that removes the cookie from the browser. */
    public String expiredCookieHeader() {
        return COOKIE_NAME + "="
                + "; Path=/"
                + "; Max-Age=0"
                + "; HttpOnly; SameSite=Strict";
    }

    private static String token(Cookie cookie) {
        if (cookie == null || cookie.getValue() == null || cookie.getValue().isBlank()) {
            return null;
        }
        return cookie.getValue();
    }

    private void purgeExpired() {
        Instant now = Instant.now();
        for (Iterator<Map.Entry<String, Session>> it = sessions.entrySet().iterator(); it.hasNext();) {
            if (it.next().getValue().expiresAt().isBefore(now)) {
                it.remove();
            }
        }
    }
}
