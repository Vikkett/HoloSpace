const API_URL = 'http://localhost:3000';
let googleButtonRendered = false;

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
            map: loader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg'),
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

function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
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

function showNotification(message, type = 'info', duration = 4000) {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    const icons = { success: '✦', error: '✕', info: '◉', warning: '⚠' };
    notification.innerHTML = `<div class="notification-icon">${icons[type]}</div><div class="notification-message">${message}</div><button class="notification-close" onclick="this.parentElement.remove()">×</button>`;
    container.appendChild(notification);
    setTimeout(() => {
        notification.classList.add('hiding');
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

async function handleCredentialResponse(response) {
    try {
        const res = await fetch(`${API_URL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: response.credential })
        });
        const data = await res.json();
        if (data.success) {
            setCookie('holospace_jwt', data.jwt, 7);
            setCookie('holospace_user', encodeURIComponent(JSON.stringify(data.user)), 7);
            // After login redirect to AI universe
            window.location.href = 'ai-universe.html';
        }
    } catch (err) { 
        showNotification('Erreur de connexion', 'error');
    }
}

function updateUI(userData) {
    document.getElementById('main-title').innerHTML = `Bienvenue, <span>${userData.given_name}</span>`;
    const userImg = document.getElementById('user-photo');
    const navText = document.getElementById('nav-text');
    if (userData.picture) {
        userImg.src = userData.picture;
        userImg.style.display = "inline-block";
        navText.style.display = "none";
    }
}

// DEMO: Always goes to universe.html (demo mode)
function enterDemo() {
    sessionStorage.setItem('holospace_demo', 'true');
    window.location.href = 'universe.html';
}

window.onload = function () {
    initLandingEarth();
    
    const savedJwt = getCookie('holospace_jwt');
    const savedUser = getCookie('holospace_user');
    
    if (savedJwt && savedUser) {
        try {
            updateUI(JSON.parse(decodeURIComponent(savedUser)));
        } catch (e) { console.error(e); }
    }
    
    google.accounts.id.initialize({
        client_id: "537399217521-4v13efe1d9kal8hs5f0vpjp2gm9598e8.apps.googleusercontent.com",
        callback: handleCredentialResponse
    });

    // Handle NAV button (Commencer/Profile)
    document.getElementById('nav-auth-btn').onclick = (e) => {
        e.preventDefault();
        if (!getCookie('holospace_jwt')) {
            // Not logged in - open login modal
            document.getElementById('login-modal').classList.add('active');
            if (!googleButtonRendered) {
                google.accounts.id.renderButton(
                    document.getElementById("google-btn-container"), 
                    { theme: "outline", size: "large" }
                );
                googleButtonRendered = true;
            }
        } else {
            // Logged in - toggle dropdown
            document.getElementById('profile-dropdown').classList.toggle('active');
        }
    };

    // Handle CREATE button (Créer mon univers)
    document.getElementById('create-btn').onclick = (e) => {
        e.preventDefault();
        if (!getCookie('holospace_jwt')) {
            // Not logged in - open login modal
            document.getElementById('login-modal').classList.add('active');
            if (!googleButtonRendered) {
                google.accounts.id.renderButton(
                    document.getElementById("google-btn-container"), 
                    { theme: "outline", size: "large" }
                );
                googleButtonRendered = true;
            }
        } else {
            // Logged in - go to AI universe
            window.location.href = 'ai-universe.html';
        }
    };

    // Handle START button (Lancer l'expérience)
    document.getElementById('start-btn').onclick = (e) => {
        e.preventDefault();
        if (!getCookie('holospace_jwt')) {
            // Not logged in - open login modal
            document.getElementById('login-modal').classList.add('active');
            if (!googleButtonRendered) {
                google.accounts.id.renderButton(
                    document.getElementById("google-btn-container"), 
                    { theme: "outline", size: "large" }
                );
                googleButtonRendered = true;
            }
        } else {
            // Logged in - go to AI universe
            window.location.href = 'ai-universe.html';
        }
    };
};

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

function logout() {
    deleteCookie('holospace_jwt');
    deleteCookie('holospace_user');
    location.reload();
}

// Close modal when clicking X
document.querySelector('.close-modal').onclick = closeLoginModal;

// Close modal when clicking outside
window.onclick = (e) => {
    if (e.target === document.getElementById('login-modal')) {
        closeLoginModal();
    }
    if (e.target === document.getElementById('logout-confirm-modal')) {
        closeLogoutModal();
    }
    // Close dropdown when clicking outside
    if (!e.target.closest('#nav-auth-btn') && !e.target.closest('.dropdown-menu')) {
        document.getElementById('profile-dropdown').classList.remove('active');
    }
};