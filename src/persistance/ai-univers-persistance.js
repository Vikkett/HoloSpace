// ============================================================
// PERSISTENCE LAYER — Three.js scene state: init, build, update.
// No DOM events, no API calls, no UI logic.
// ============================================================

let scene, camera, renderer, stars, controls, centralSun;
let planets = [];
let orbits  = [];
let ambientLight, sunLight;
let nebulaMesh     = null;
let isLoading      = false;
let universeSetup = null;
let manualSkyOverride = false;
let sunColorLocked = false;   // mirrored from session, set via setSunColorLocked()

// ── Init ──────────────────────────────────────────────────────

function initScene() {
    if (renderer) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020208);
    scene.fog = new THREE.FogExp2(0x000000, 0.0008);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 4000);
    camera.position.set(0, 250, 500);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    sunLight = new THREE.PointLight(0xffffff, 2.5, 1500);
    scene.add(sunLight);

    const sunGeo = new THREE.SphereGeometry(35, 64, 64);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    centralSun = new THREE.Mesh(sunGeo, sunMat);
    scene.add(centralSun);

    _initStars();
    _initNebula();
}

function _initStars() {
    const starGeo    = new THREE.BufferGeometry();
    const starCoords = [];
    for (let i = 0; i < 15000; i++) {
        starCoords.push(
            (Math.random() - 0.5) * 3000,
            (Math.random() - 0.5) * 3000,
            (Math.random() - 0.5) * 3000
        );
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starCoords, 3));
    stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
        color: 0xffffff, size: 0.8, transparent: true
    }));
    scene.add(stars);
}

function _initNebula() {
    const nebulaGeo = new THREE.SphereGeometry(800, 32, 32);

    const nebulaMat = new THREE.ShaderMaterial({
        uniforms: {
            time:      { value: 0 },
            color1:    { value: new THREE.Color(0x4a0080) },
            color2:    { value: new THREE.Color(0x00d4ff) },
            intensity: { value: 0.3 }
        },
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vPosition;
            void main() {
                vUv = uv;
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            uniform vec3 color1;
            uniform vec3 color2;
            uniform float intensity;
            varying vec2 vUv;
            varying vec3 vPosition;

            vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
            vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

            float snoise(vec3 v) {
                const vec2 C = vec2(1.0/6.0, 1.0/3.0);
                const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
                vec3 i  = floor(v + dot(v, C.yyy));
                vec3 x0 = v - i + dot(i, C.xxx);
                vec3 g = step(x0.yzx, x0.xyz);
                vec3 l = 1.0 - g;
                vec3 i1 = min(g.xyz, l.zxy);
                vec3 i2 = max(g.xyz, l.zxy);
                vec3 x1 = x0 - i1 + C.xxx;
                vec3 x2 = x0 - i2 + C.yyy;
                vec3 x3 = x0 - D.yyy;
                i = mod289(i);
                vec4 p = permute(permute(permute(
                    i.z + vec4(0.0, i1.z, i2.z, 1.0))
                    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
                float n_ = 0.142857142857;
                vec3 ns = n_ * D.wyz - D.xzx;
                vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                vec4 x_ = floor(j * ns.z);
                vec4 y_ = floor(j - 7.0 * x_);
                vec4 x = x_ * ns.x + ns.yyyy;
                vec4 y = y_ * ns.x + ns.yyyy;
                vec4 h = 1.0 - abs(x) - abs(y);
                vec4 b0 = vec4(x.xy, y.xy);
                vec4 b1 = vec4(x.zw, y.zw);
                vec4 s0 = floor(b0)*2.0 + 1.0;
                vec4 s1 = floor(b1)*2.0 + 1.0;
                vec4 sh = -step(h, vec4(0.0));
                vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
                vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
                vec3 p0 = vec3(a0.xy, h.x);
                vec3 p1 = vec3(a0.zw, h.y);
                vec3 p2 = vec3(a1.xy, h.z);
                vec3 p3 = vec3(a1.zw, h.w);
                vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
                p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
                vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                m = m * m;
                return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
            }

            void main() {
                float noise  = snoise(vPosition * 0.002 + time * 0.1);
                float noise2 = snoise(vPosition * 0.005 - time * 0.15);
                float blend  = noise * 0.5 + 0.5;
                vec3 color   = mix(color1, color2, blend);
                float alpha  = (noise2 * 0.5 + 0.5) * intensity;
                alpha = smoothstep(0.2, 0.8, alpha);
                gl_FragColor = vec4(color, alpha);
            }
        `,
        transparent: true,
        side:        THREE.BackSide,
        depthWrite:  false,
        blending:    THREE.AdditiveBlending
    });

    nebulaMesh = new THREE.Mesh(nebulaGeo, nebulaMat);
    nebulaMesh.visible = false;
    scene.add(nebulaMesh);
}

// ── Animation loop ────────────────────────────────────────────

function startAnimationLoop() {
    function animate() {
        requestAnimationFrame(animate);
        stars.rotation.y += 0.0001;

        if (centralSun) {
            const basePulse    = 1 + Math.sin(Date.now() * 0.002) * 0.05;
            const loadingBoost = isLoading ? 0.15 : 0;
            centralSun.scale.setScalar(basePulse + loadingBoost);
        }

        if (nebulaMesh && nebulaMesh.visible) {
            nebulaMesh.material.uniforms.time.value = Date.now() * 0.001;
            nebulaMesh.rotation.y += 0.0002;
        }

        planets.forEach(p => {
            p.angle += p.speed;
            p.group.position.x = Math.cos(p.angle) * p.distance;
            p.group.position.z = Math.sin(p.angle) * p.distance;
            p.group.rotation.y += 0.01;
        });

        controls.update();
        renderer.render(scene, camera);
    }
    animate();
}

// ── Universe / planets ────────────────────────────────────────

/**
 * Rebuilds the planet scene from a normalised planet array (from domain layer).
 */
function buildUniverse(planetData) {
    console.log('Updating universe with', planetData.length, 'planets');

    planets.forEach(p => scene.remove(p.group));
    orbits.forEach(o => scene.remove(o));
    planets = [];
    orbits  = [];

    if (!sunColorLocked) {
        _applyFirstPlanetColorToSun(planetData[0]);
    }

    planetData.forEach((p, index) => {
        try {
            _buildPlanet(p, index);
        } catch (e) {
            console.error('Planet build error:', e);
        }
    });
}

function _applyFirstPlanetColorToSun(planet) {
    try {
        const colorNum = typeof planet.color === 'number'
            ? planet.color
            : new THREE.Color(planet.color).getHex();
        if (!isNaN(colorNum)) centralSun.material.color.setHex(colorNum);
    } catch (e) {
        console.log('Could not set sun color from first planet:', e);
    }
}

function _buildPlanet(p, index) {
    const group    = new THREE.Group();
    const colorNum = typeof p.color === 'number'
        ? p.color
        : new THREE.Color(String(p.color)).getHex();

    const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(p.size, 32, 32),
        new THREE.MeshStandardMaterial({ color: colorNum, metalness: 0.3, roughness: 0.7 })
    );
    group.add(mesh);

    if (p.hasClouds) {
        group.add(new THREE.Mesh(
            new THREE.SphereGeometry(p.size + 0.6, 32, 32),
            new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 })
        ));
    }

    if (p.hasRings) {
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(p.size * 1.6, p.size * 2.5, 64),
            new THREE.MeshStandardMaterial({ color: colorNum, side: THREE.DoubleSide, transparent: true, opacity: 0.4 })
        );
        ring.rotation.x = Math.PI / 2.2;
        group.add(ring);
    }

    const orbit = new THREE.Mesh(
        new THREE.RingGeometry(p.dist - 0.5, p.dist + 0.5, 128),
        new THREE.MeshBasicMaterial({ color: colorNum, side: THREE.DoubleSide, transparent: true, opacity: 0.08 })
    );
    orbit.rotation.x = Math.PI / 2;
    scene.add(orbit);
    orbits.push(orbit);

    planets.push({
        group,
        distance: p.dist,
        speed:    p.speed,
        angle:    (index / Math.max(planets.length + 1, 1)) * Math.PI * 2,
        name:     p.name,
    });
    scene.add(group);
}

// ── Sun ───────────────────────────────────────────────────────

function applySunColor(hexColor, lock = false) {
    if (!centralSun) return;
    centralSun.material.color.setHex(hexColor);
    sunLight.color.setHex(hexColor);
    if (lock) sunColorLocked = true;
    console.log(`Sun color: #${hexColor.toString(16)} | locked=${sunColorLocked}`);
}

function setSunColorLocked(value) {
    sunColorLocked = value;
}

function isSunColorLocked() {
    return sunColorLocked;
}

// ── Environment ───────────────────────────────────────────────

/**
 * Applies environment params (output of domain.mapEnvironmentParams) to the scene.
 */
function updateEnvironment(params) {
    if (!params) return;

    const { vibe = 'neutral', mood = 'mystique', primaryColor = 0x00d4ff, secondaryColor = 0x4a0080, energy = 'medium' } = params;

    const pColor = typeof primaryColor   === 'string' ? parseInt(primaryColor.replace('#', ''),   16) : primaryColor;
    const sColor = typeof secondaryColor === 'string' ? parseInt(secondaryColor.replace('#', ''), 16) : secondaryColor;

    const bgColors = { lonely: 0x050510, energetic: 0x000000, mystique: 0x020208, chaotic: 0x100505, neutral: 0x000000 };
    scene.background = new THREE.Color(bgColors[vibe] || bgColors[mood] || bgColors.neutral);

    const fogSettings = {
        lonely:    { color: 0x0a0a1a, density: 0.0003 },
        energetic: { color: 0x000000, density: 0.0001 },
        mystique:  { color: 0x0d1a2e, density: 0.0002 },
        chaotic:   { color: 0x1a0505, density: 0.0004 },
        neutral:   { color: 0x000000, density: 0.0001 }
    };
    const fog = fogSettings[vibe] || fogSettings[mood] || fogSettings.neutral;
    scene.fog.color.setHex(fog.color);
    scene.fog.density = fog.density;

    const lightLevels = { low: 0.15, medium: 0.4, high: 0.7 };
    ambientLight.intensity = lightLevels[energy] || lightLevels.medium;
    const ambientColor = new THREE.Color(pColor);
    ambientColor.lerp(new THREE.Color(0xffffff), 0.7);
    ambientLight.color.copy(ambientColor);

    if (stars) {
        const starColor = new THREE.Color(pColor);
        starColor.lerp(new THREE.Color(0xffffff), 0.5);
        stars.material.color.copy(starColor);
        stars.material.size    = energy === 'high' ? 1.0 : 0.7;
        stars.material.opacity = 0.9;
    }

    const nebulaIntensity = { lonely: 0.1, energetic: 0.5, mystique: 0.35, chaotic: 0.4, neutral: 0.2 };
    if (nebulaMesh) {
        const intensity = nebulaIntensity[vibe] || nebulaIntensity[mood] || 0.2;
        nebulaMesh.visible = intensity > 0.15;
        if (nebulaMesh.visible) {
            nebulaMesh.material.uniforms.color1.value.setHex(sColor);
            nebulaMesh.material.uniforms.color2.value.setHex(pColor);
            nebulaMesh.material.uniforms.intensity.value = intensity;
        }
    }

    sunLight.intensity = energy === 'high' ? 3.0 : energy === 'low' ? 1.5 : 2.5;
    if (!sunColorLocked) sunLight.color.setHex(pColor);
}

// ── Sky ───────────────────────────────────────────────────────

function changeSky(typeOrHex) {
    if (stars) {
        scene.remove(stars);
        stars.geometry.dispose();
        stars.material.dispose();
    }

    let color;
    if (typeof typeOrHex === 'string' && (typeOrHex.startsWith('#') || typeOrHex.startsWith('0x'))) {
        color = new THREE.Color(typeOrHex);
    } else {
        const presets = { nebuleuse: 0xff00ff, galaxie: 0x00d4ff, vide: 0xffffff };
        color = new THREE.Color(presets[typeOrHex] ?? 0xffffff);
    }

    const starGeo = new THREE.BufferGeometry();
    const coords  = [];
    for (let i = 0; i < 15000; i++) {
        coords.push(
            (Math.random() - 0.5) * 3000,
            (Math.random() - 0.5) * 3000,
            (Math.random() - 0.5) * 3000
        );
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(coords, 3));
    stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
        color, size: 1.2, transparent: true, opacity: 0.9, sizeAttenuation: true
    }));
    scene.add(stars);
}

// ── Loading state ─────────────────────────────────────────────

function setLoading(loading) {
    isLoading = loading;
    if (loading) {
        if (stars) stars.rotation.y += 0.002;
        planets.forEach(p => {
            p.userData = { ...p.userData, originalSpeed: p.speed };
            p.speed *= 3;
        });
    } else {
        planets.forEach(p => {
            if (p.userData?.originalSpeed !== undefined) p.speed = p.userData.originalSpeed;
        });
    }
}

// ── Resize ────────────────────────────────────────────────────

function onResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}