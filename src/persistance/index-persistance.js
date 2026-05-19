// ============================================================
// PERSISTENCE LAYER — All reads and writes to storage.
// No DOM manipulation, no business logic.
// ============================================================

const SESSION_COOKIE_DAYS = 7;

// ── Cookies ──────────────────────────────────────────────────

function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/; SameSite=Lax`;
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

function deleteCookie(name) {
    document.cookie = `${name}=; Max-Age=0; path=/;`;
}

// ── Session (JWT + user, stored in cookies) ──────────────────

/**
 * Persists a user session returned by the domain auth call.
 * @param {{ jwt: string, user: object }} session
 */
function saveSession(session) {
    setCookie('holospace_jwt', session.jwt, SESSION_COOKIE_DAYS);
    setCookie(
        'holospace_user',
        encodeURIComponent(JSON.stringify(session.user)),
        SESSION_COOKIE_DAYS
    );
}

/**
 * Reads the current session from cookies.
 * @returns {{ jwt: string|null, user: object|null }}
 */
function loadSession() {
    return {
        jwt: getCookie('holospace_jwt'),
        rawUser: getCookie('holospace_user'),
    };
}

/**
 * Removes all session cookies (logout).
 */
function clearSession() {
    deleteCookie('holospace_jwt');
    deleteCookie('holospace_user');
}

// ── Demo flag (sessionStorage) ────────────────────────────────

function setDemoMode() {
    sessionStorage.setItem('holospace_demo', 'true');
}

function isDemoMode() {
    return sessionStorage.getItem('holospace_demo') === 'true';
}