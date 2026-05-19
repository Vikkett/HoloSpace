// ============================================================
// PRESENTATION LAYER — DOM, events, Three.js, notifications.
// Calls domain and persistence; never touches storage directly.
// ============================================================

let googleButtonRendered = false;

// ── Three.js Earth ───────────────────────────────────────────

function initLandingEarth() {
    const container = document.getElementById('earth-container');
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.z = 35;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(300, 300);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const sun = new THREE.DirectionalLight(0xffffff, 1);
    sun.position.set(5, 3, 5);
    scene.add(sun);

    const loader = new THREE.TextureLoader();
    const earth = new THREE.Mesh(
        new THREE.SphereGeometry(10, 64, 64),
        new THREE.MeshStandardMaterial({
            map: loader.load(
                'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg'
            ),
        })
    );
    scene.add(earth);

    function animate() {
        requestAnimationFrame(animate);
        earth.rotation.y += 0.002;
        renderer.render(scene, camera);
    }
    animate();
}

// ── Notifications ────────────────────────────────────────────

function showNotification(message, type = 'info', duration = 4000) {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    const icons = { success: '✦', error: '✕', info: '◉', warning: '⚠' };
    notification.innerHTML = `
        <div class="notification-icon">${icons[type]}</div>
        <div class="notification-message">${message}</div>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(notification);
    setTimeout(() => {
        notification.classList.add('hiding');
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// ── Auth UI helpers ──────────────────────────────────────────

function renderGoogleButtonOnce() {
    if (googleButtonRendered) return;
    google.accounts.id.renderButton(
        document.getElementById('google-btn-container'),
        { theme: 'outline', size: 'large' }
    );
    googleButtonRendered = true;
}

function openLoginModal() {
    document.getElementById('login-modal').classList.add('active');
    renderGoogleButtonOnce();
}

function closeLoginModal() {
    document.getElementById('login-modal').classList.remove('active');
}

function openLogoutModal(e) {
    e.preventDefault();
    document.getElementById('profile-dropdown').classList.remove('active');
    document.getElementById('logout-confirm-modal').classList.add('active');
}

function closeLogoutModal() {
    document.getElementById('logout-confirm-modal').classList.remove('active');
}

// ── UI state update ──────────────────────────────────────────

function updateUI(userData) {
    document.getElementById('main-title').innerHTML =
        `Bienvenue, <span>${userData.given_name}</span>`;

    const userImg = document.getElementById('user-photo');
    const navText = document.getElementById('nav-text');

    if (userData.picture) {
        userImg.src = userData.picture;
        userImg.style.display = 'inline-block';
        navText.style.display = 'none';
    }
}

// ── Navigation helpers ───────────────────────────────────────

function goToUniverse() {
    window.location.href = 'ai-universe.html';
}

// ── Demo mode ────────────────────────────────────────────────

function enterDemo() {
    setDemoMode();                       // persistence
    window.location.href = 'universe.html';
}

// ── Google credential callback ───────────────────────────────

async function handleCredentialResponse(response) {
    try {
        // domain: validate token with backend
        const data = await authenticateWithGoogle(response.credential);

        if (data.success) {
            // persistence: store session
            saveSession({ jwt: data.jwt, user: data.user });
            goToUniverse();
        } else {
            showNotification('Authentification échouée', 'error');
        }
    } catch {
        showNotification('Erreur de connexion', 'error');
    }
}

// ── Logout ───────────────────────────────────────────────────

function logout() {
    clearSession();           // persistence
    location.reload();
}

// ── Guard: open modal or navigate ───────────────────────────

function requireAuthOrOpenModal() {
    const session = loadSession();                      // persistence
    if (!isAuthenticated(session)) {                   // domain
        openLoginModal();
    } else {
        goToUniverse();
    }
}

// ── Bootstrap ────────────────────────────────────────────────

window.onload = function () {
    initLandingEarth();

    // Restore session from persistence
    const { jwt, rawUser } = loadSession();
    const user = parseUserData(rawUser);               // domain

    if (isAuthenticated({ jwt, user })) {              // domain
        updateUI(user);
    }

    // Init Google Sign-In
    google.accounts.id.initialize({
        client_id: '537399217521-4v13efe1d9kal8hs5f0vpjp2gm9598e8.apps.googleusercontent.com',
        callback: handleCredentialResponse,
    });

    // NAV button: profile dropdown (logged in) or login modal
    document.getElementById('nav-auth-btn').onclick = (e) => {
        e.preventDefault();
        if (!isAuthenticated({ jwt, user })) {
            openLoginModal();
        } else {
            document.getElementById('profile-dropdown').classList.toggle('active');
        }
    };

    // CREATE and START buttons share the same guard
    document.getElementById('create-btn').onclick = (e) => {
        e.preventDefault();
        requireAuthOrOpenModal();
    };

    document.getElementById('start-btn').onclick = (e) => {
        e.preventDefault();
        requireAuthOrOpenModal();
    };

    // Close modal on × click
    document.querySelector('.close-modal').onclick = closeLoginModal;

    // Close modal / dropdown on outside click
    window.onclick = (e) => {
        if (e.target === document.getElementById('login-modal')) closeLoginModal();
        if (e.target === document.getElementById('logout-confirm-modal')) closeLogoutModal();

        if (
            !e.target.closest('#nav-auth-btn') &&
            !e.target.closest('.dropdown-menu')
        ) {
            document.getElementById('profile-dropdown').classList.remove('active');
        }
    };
};