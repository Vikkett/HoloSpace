// ============================================================
// DOMAIN LAYER — Pure business logic. No DOM, no storage calls.
// ============================================================

const API_URL = 'http://localhost:3000';

/**
 * Authenticates a Google credential token against the backend.
 * Returns { success, jwt, user } or throws on network error.
 */
async function authenticateWithGoogle(credential) {
    const res = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credential }),
    });

    if (!res.ok) {
        throw new Error(`Auth request failed: ${res.status}`);
    }

    return res.json(); // { success, jwt, user }
}

/**
 * Checks whether a session object represents a valid authenticated user.
 */
function isAuthenticated(session) {
    return !!(session && session.jwt && session.user);
}

/**
 * Parses and validates the raw stored user string.
 * Returns the user object or null if invalid.
 */
function parseUserData(rawUser) {
    if (!rawUser) return null;
    try {
        return JSON.parse(decodeURIComponent(rawUser));
    } catch {
        return null;
    }
}