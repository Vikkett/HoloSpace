// exposes all functions to Jest + jsdom window

Object.assign(window, {
    init,
    toggleChat,
    addMsg,
    inferVibe,
    inferEnergy,
    fillMissing,
    buildUniverse,
    updateEnvironment,
    changeSky,
    animate,
    talkToBot,
    validateAndGo,
    handleUserMsg
});


// this whole thing is held together with duct tape and hope
let scene, camera, renderer, stars, controls, centralSun;
let planets = [];
let orbits = [];
let sessionId = crypto.randomUUID();
let currentPhase = 'discuss';
let universeSetup = null;

// keep track of lights so we can tweak em later
let ambientLight, sunLight;
let nebulaMesh = null;
let manualSkyOverride = false;
let isLoading = false;

// toggle that chat panel
function toggleChat() {
    document.getElementById('chat-window').classList.toggle('active');
}

// fire up the three.js scene
function init() {
    scene = new THREE.Scene();
    
    // fog init starts subtle
    scene.fog = new THREE.FogExp2(0x000000, 0.0008);
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 4000);
    camera.position.set(0, 250, 500);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // lights we can actually adjust later
    ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    sunLight = new THREE.PointLight(0xffffff, 2.5, 1500);
    scene.add(sunLight);

    // central sun just a white sphere for now
    const sunGeo = new THREE.SphereGeometry(35, 64, 64);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    centralSun = new THREE.Mesh(sunGeo, sunMat);
    scene.add(centralSun);

    // stars background
    const starGeo = new THREE.BufferGeometry();
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
        color: 0xffffff,
        size: 0.8,
        transparent: true
    }));
    scene.add(stars);

    // init nebula but keep it hidden till we need it
    initNebula();

    animate();
}

// shader nebula — procedural, colorable
function initNebula() {
    const nebulaGeo = new THREE.SphereGeometry(800, 32, 32);
    
    const nebulaShader = {
        uniforms: {
            time: { value: 0 },
            color1: { value: new THREE.Color(0x4a0080) },
            color2: { value: new THREE.Color(0x00d4ff) },
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
                p0 *= norm.x;
                p1 *= norm.y;
                p2 *= norm.z;
                p3 *= norm.w;
                vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                m = m * m;
                return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
            }
            
            void main() {
                float noise = snoise(vPosition * 0.002 + time * 0.1);
                float noise2 = snoise(vPosition * 0.005 - time * 0.15);
                float blend = noise * 0.5 + 0.5;
                vec3 color = mix(color1, color2, blend);
                float alpha = (noise2 * 0.5 + 0.5) * intensity;
                alpha = smoothstep(0.2, 0.8, alpha);
                gl_FragColor = vec4(color, alpha);
            }
        `,
        transparent: true,
        side: THREE.BackSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    };
    
    const nebulaMat = new THREE.ShaderMaterial(nebulaShader);
    nebulaMesh = new THREE.Mesh(nebulaGeo, nebulaMat);
    nebulaMesh.visible = false;
    scene.add(nebulaMesh);
}

// main loop
function animate() {
    requestAnimationFrame(animate);
    stars.rotation.y += 0.0001;
    
    if (centralSun) {
        // bigger pulse when loading
        const basePulse = 1 + Math.sin(Date.now() * 0.002) * 0.05;
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

function updateEnvironment(params) {
    if (!params) return;
    
    const {
        vibe = 'neutral',
        mood = 'mystique',
        primaryColor = 0x00d4ff,
        secondaryColor = 0x4a0080,
        energy = 'medium'
    } = params;
    
    const pColor = typeof primaryColor === 'string' ? parseInt(primaryColor.replace('#', ''), 16) : primaryColor;
    const sColor = typeof secondaryColor === 'string' ? parseInt(secondaryColor.replace('#', ''), 16) : secondaryColor;
    
    const bgColors = {
        lonely: 0x050510,
        energetic: 0x000000,
        mystique: 0x020208,
        chaotic: 0x100505,
        neutral: 0x000000
    };
    scene.background = new THREE.Color(bgColors[vibe] || bgColors[mood] || bgColors.neutral);
    
    const fogSettings = {
        lonely: { color: 0x0a0a1a, density: 0.0003 },
        energetic: { color: 0x000000, density: 0.0001 },
        mystique: { color: 0x0d1a2e, density: 0.0002 },
        chaotic: { color: 0x1a0505, density: 0.0004 },
        neutral: { color: 0x000000, density: 0.0001 }
    };
    
    const fog = fogSettings[vibe] || fogSettings[mood] || fogSettings.neutral;
    scene.fog.color.setHex(fog.color);
    scene.fog.density = fog.density;
    
    const lightLevels = {
        low: 0.15,
        medium: 0.4,
        high: 0.7
    };
    
    ambientLight.intensity = lightLevels[energy] || lightLevels.medium;
    const ambientColor = new THREE.Color(pColor);
    ambientColor.lerp(new THREE.Color(0xffffff), 0.7);
    ambientLight.color.copy(ambientColor);

    if (stars && !manualSkyOverride) {
        const starColor = new THREE.Color(pColor);
        starColor.lerp(new THREE.Color(0xffffff), 0.5);
        stars.material.color.copy(starColor);
        stars.material.size = energy === 'high' ? 1.0 : 0.7;
        stars.material.opacity = 0.9;
    }
    
    const nebulaIntensity = {
        lonely: 0.1,
        energetic: 0.5,
        mystique: 0.35,
        chaotic: 0.4,
        neutral: 0.2
    };
    
    if (nebulaMesh) {
        const intensity = nebulaIntensity[vibe] || nebulaIntensity[mood] || 0.2;
        
        if (intensity > 0.15) {
            nebulaMesh.visible = true;
            nebulaMesh.material.uniforms.color1.value.setHex(sColor);
            nebulaMesh.material.uniforms.color2.value.setHex(pColor);
            nebulaMesh.material.uniforms.intensity.value = intensity;
        } else {
            nebulaMesh.visible = false;
        }
    }
    
    sunLight.intensity = energy === 'high' ? 3.0 : energy === 'low' ? 1.5 : 2.5;
    sunLight.color.setHex(pColor);
    
    console.log('Environment updated:', { vibe, energy, manualSkyOverride });
}

// ===== LOADING STATE =====
function setLoading(loading) {
    isLoading = loading;
    const btn = document.getElementById('send-btn');
    const input = document.getElementById('user-input');
    
    if (loading) {
        btn.innerText = '...';
        btn.disabled = true;
        input.disabled = true;
        
        // speed up stars
        stars.userData = { originalSpeed: stars.rotation.y };
        stars.rotation.y = 0.002;
        
        // speed up planets
        planets.forEach(p => {
            p.userData = { ...p.userData, originalSpeed: p.speed };
            p.speed *= 3;
        });
        
    } else {
        btn.innerText = 'CRÉER';
        btn.disabled = false;
        input.disabled = false;
        
        // restore speeds
        if (stars.userData?.originalSpeed !== undefined) {
            stars.rotation.y = stars.userData.originalSpeed;
        }
        planets.forEach(p => {
            if (p.userData?.originalSpeed !== undefined) {
                p.speed = p.userData.originalSpeed;
            }
        });
    }
}

// kick off the ai convo
async function startConvo() {
    await talkToBot(null);
}

async function handleUserMsg() {
    const inputField = document.getElementById('user-input');
    const text = inputField.value.trim();
    if (!text) return;

    addMsg(text, 'user');
    inputField.value = "";

    let finalMessage = text;

    // if we have setup data and haven't used it yet, append it AND force creation
    if (universeSetup && !universeSetup.used) {
        finalMessage += `

PARAMÈTRES UTILISATEUR:
- vibe: ${universeSetup.vibe}
- style: ${universeSetup.style}
- musique: ${universeSetup.musicEnabled ? universeSetup.musicType : 'aucune'}

Ces paramètres viennent du formulaire de personnalisation. Crée l'univers IMMÉDIATEMENT avec ces paramètres. Ne pose pas de questions.`;

        universeSetup.used = true;
    }

    await talkToBot(finalMessage);
}

function triggerGeneration() {
    const input = document.getElementById('user-input');
    input.value = "crée mon univers";
    handleUserMsg();
}

// talk to the backend — FULL JSON WIRING
async function talkToBot(userMessage) {
    setLoading(true);
    
    try {
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                sessionId: sessionId, 
                userMessage: userMessage 
            })
        });

        const data = await response.json();
        currentPhase = data.phase || currentPhase;
        
        let cleanMessage = data.message
            .replace(/\{[\s\S]*?"planets"[\s\S]*?\}/g, '')
            .replace(/\[PLANETS_START\].*?\[PLANETS_END\]/gs, '')
            .trim();
        
        addMsg(cleanMessage, 'ai');

        // === USE SERVER ENVIRONMENT DATA (PRIORITY) ===
        if (data.environment) {
            const env = data.environment;
            
            if (env.skyColor) {
                setSkyColor(env.skyColor);
            }
            
            const fogMap = { low: 0.0001, medium: 0.0003, high: 0.0006 };
            if (env.fogDensity && fogMap[env.fogDensity]) {
                scene.fog.density = fogMap[env.fogDensity];
            }
            
            if (env.ambientIntensity !== undefined) {
                ambientLight.intensity = env.ambientIntensity;
            }
            
            if (nebulaMesh) {
                nebulaMesh.visible = !!env.nebula;
            }
        }

        // === USE SERVER AUDIO DATA (PRIORITY) ===
        if (data.audio && data.audio.track) {
            startMusic(data.audio.track);
            if (data.audio.volume !== undefined) {
                const audio = document.getElementById('bg-music');
                audio.volume = data.audio.volume;
            }
        }

        // === FALLBACK: COLOR DETECTION FROM TEXT ===
        const colorMatch = cleanMessage.match(/#([0-9A-Fa-f]{6})/);
        if (colorMatch && !data.environment?.skyColor) {
            setSkyColor('#' + colorMatch[1]);
        }

        if (cleanMessage.toLowerCase().includes('ciel') && cleanMessage.toLowerCase().includes('rouge')) {
            setSkyColor('#FF3737');
        }

        // === PLANETS ===
        if (data.isComplete && data.planets && data.planets.length > 0) {
            console.log('Received', data.planets.length, 'planets:', data.planets);
            
            if (data.planets.length !== 5) {
                console.warn('Expected 5 planets, got', data.planets.length);
                addMsg(`⚠️ Nova a généré ${data.planets.length} planètes au lieu de 5. Je complète avec des planètes aléatoires...`, 'ai');
                data.planets = fillMissing(data.planets);
            }
            
            buildUniverse(data.planets);

            // fallback environment from planets if server didn't send explicit env
            if (universeSetup && !data.environment) {
                const envParams = {
                    vibe: inferVibe(universeSetup.vibe, data.planets[0]?.color),
                    mood: universeSetup.style,
                    primaryColor: data.planets[0]?.color || 0x00d4ff,
                    secondaryColor: data.planets[2]?.color || 0x4a0080,
                    energy: inferEnergy(universeSetup.vibe)
                };
                updateEnvironment(envParams);
            }
            
            // fallback audio from user setup if server didn't send audio
            if (universeSetup && !data.audio && universeSetup.musicEnabled) {
                startMusic(universeSetup.musicType);
            }

            if (currentPhase === 'create') {
                document.getElementById('mode-indicator').innerText = "✦ SYSTÈME DÉPLOYÉ";
                document.getElementById('user-input').placeholder = "Demande des modifications...";
                addMsg("✨ Votre univers est né ! Demandez-moi de changer des couleurs, ajouter des planètes, ou modifier l'ambiance.", 'ai');
            } else if (currentPhase === 'modify') {
                document.getElementById('mode-indicator').innerText = "✦ UNIVERS MODIFIÉ";
            }
        } else {
            document.getElementById('mode-indicator').innerText = "✦ AI UNIVERSE";
        }
        
    } catch (e) {
        console.error('Error:', e);
        addMsg("✕ Erreur critique : Liaison avec Nova rompue.", 'ai');
        document.getElementById('mode-indicator').innerText = "✕ ERREUR";
    } finally {
        setLoading(false);
    }
}

// helpers to map user text to environment params
function inferVibe(vibeText, planetColor) {
    const text = vibeText.toLowerCase();
    if (text.includes('sombre') || text.includes('dark') || text.includes('lonely')) return 'lonely';
    if (text.includes('energ') || text.includes('chaos') || text.includes('fort')) return 'energetic';
    if (text.includes('myst') || text.includes('dream') || text.includes('oni')) return 'mystique';
    if (text.includes('chaot') || text.includes('crazy')) return 'chaotic';
    return 'neutral';
}

function inferEnergy(vibeText) {
    const text = vibeText.toLowerCase();
    if (text.includes('calme') || text.includes('soft') || text.includes('doux')) return 'low';
    if (text.includes('fort') || text.includes('intense') || text.includes('energ')) return 'high';
    return 'medium';
}

// fallback planets if the ai screws up
function fillMissing(existing) {
    const defaultPlanets = [
        { name: "Etheria", size: 8, dist: 100, color: "0x9B59B6", speed: 0.005, hasRings: false, hasClouds: true },
        { name: "Cryon", size: 6, dist: 180, color: "0x3498DB", speed: 0.003, hasRings: true, hasClouds: false },
        { name: "Pyros", size: 12, dist: 250, color: "0xE74C3C", speed: 0.007, hasRings: false, hasClouds: true },
        { name: "Verdania", size: 10, dist: 320, color: "0x2ECC71", speed: 0.004, hasRings: true, hasClouds: true },
        { name: "Astron", size: 7, dist: 380, color: "0xF1C40F", speed: 0.006, hasRings: false, hasClouds: false }
    ];
    
    const result = [...existing];
    while (result.length < 5) {
        result.push(defaultPlanets[result.length]);
    }
    return result.slice(0, 5);
}

// add a msg to the chat
function addMsg(text, sender) {
    const history = document.getElementById('chat-history');
    const div = document.createElement('div');
    div.className = sender === 'ai' ? 'ai-msg' : 'user-msg';
    div.innerHTML = text;
    history.appendChild(div);
    history.scrollTop = history.scrollHeight;
}

// rebuild the whole solar system from ai data
function buildUniverse(aiData) {
    console.log('Updating universe with', aiData.length, 'planets');
    
    planets.forEach(p => scene.remove(p.group));
    orbits.forEach(o => scene.remove(o));
    planets = [];
    orbits = [];

    if (!Array.isArray(aiData) || aiData.length === 0) {
        console.error('Invalid planet data');
        return;
    }

    try {
        const sunColor = parseInt(aiData[0].color, 16);
        if (!isNaN(sunColor)) centralSun.material.color.setHex(sunColor);
    } catch (e) {}

    aiData.forEach((p, index) => {
        try {
            const group = new THREE.Group();
            const size = parseFloat(p.size) || 8;
            const dist = parseFloat(p.dist) || 100;
            const speed = parseFloat(p.speed) || 0.005;
            const colorNum = parseInt(p.color, 16) || 0x4F86F7;
            
            const mesh = new THREE.Mesh(
                new THREE.SphereGeometry(size, 32, 32),
                new THREE.MeshStandardMaterial({ color: colorNum, metalness: 0.3, roughness: 0.7 })
            );
            group.add(mesh);

            if (p.hasClouds) {
                const cloudGeo = new THREE.SphereGeometry(size + 0.6, 32, 32);
                const cloudMat = new THREE.MeshLambertMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.15
                });
                group.add(new THREE.Mesh(cloudGeo, cloudMat));
            }

            if (p.hasRings) {
                const ring = new THREE.Mesh(
                    new THREE.RingGeometry(size * 1.6, size * 2.5, 64),
                    new THREE.MeshStandardMaterial({
                        color: colorNum,
                        side: THREE.DoubleSide,
                        transparent: true,
                        opacity: 0.4
                    })
                );
                ring.rotation.x = Math.PI / 2.2;
                group.add(ring);
            }

            const orbitGeo = new THREE.RingGeometry(dist - 0.5, dist + 0.5, 128);
            const orbitMat = new THREE.MeshBasicMaterial({
                color: colorNum,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.08
            });
            const orbit = new THREE.Mesh(orbitGeo, orbitMat);
            orbit.rotation.x = Math.PI / 2;
            scene.add(orbit);
            orbits.push(orbit);

            planets.push({
                group,
                distance: dist,
                speed: speed,
                angle: (index / aiData.length) * Math.PI * 2
            });
            scene.add(group);
            
        } catch (e) {
            console.error('Planet error:', e);
        }
    });
}

// change star color
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
        switch (typeOrHex) {
            case "nebuleuse":
                color = new THREE.Color(0xff00ff);
                break;
            case "galaxie":
                color = new THREE.Color(0x00d4ff);
                break;
            case "vide":
                color = new THREE.Color(0xffffff);
                break;
            default:
                color = new THREE.Color(0xffffff);
        }
    }

    const starGeo = new THREE.BufferGeometry();
    const coords = [];

    for (let i = 0; i < 15000; i++) {
        coords.push(
            (Math.random() - 0.5) * 3000,
            (Math.random() - 0.5) * 3000,
            (Math.random() - 0.5) * 3000
        );
    }

    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(coords, 3));

    stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
        color: color,
        size: 1.2,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true
    }));

    scene.add(stars);
    
    manualSkyOverride = true;
    console.log('Sky changed to:', color.getHexString());
}

// quick direct setter
function setSkyColor(hexString) {
    changeSky(hexString);
}

// play background music
function startMusic(type) {
    const audio = document.getElementById('bg-music');

    const tracks = {
        ambient: "./music/ambient.mp3",
        space: "./music/space.mp3",
        dark: "./music/dark.mp3"
    };

    if (tracks[type]) {
        audio.src = tracks[type];
        audio.volume = 0.4;
        audio.play();
    }
}

function validateAndGo() {
    const vibeInput = document.getElementById('setup-vibe');
    const errorSpan = document.getElementById('vibe-error');
    const vibe = vibeInput.value.trim();

    if (!vibe) {
        errorSpan.textContent = "Tu dois décrire ton vibe avant d'entrer.";
        vibeInput.classList.add('invalid');
        return;
    }

    errorSpan.textContent = "";
    vibeInput.classList.remove('invalid');

    universeSetup = {
        vibe: vibe,
        style: document.getElementById('setup-style').value,
        musicEnabled: document.getElementById('setup-music-toggle').checked,
        musicType: document.getElementById('setup-music-type').value,
        used: false
    };

    document.getElementById('setup-modal').style.display = 'none';

    document.getElementById('chat-window').style.display = 'flex';
    document.querySelector('.chat-trigger').style.display = 'flex';

    if (universeSetup.musicEnabled) {
        startMusic(universeSetup.musicType);
    }

    startConvo();
}

document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('setup-music-toggle');
    const label = document.getElementById('music-label');
    const typeGroup = document.getElementById('music-type-group');

    if (toggle) {
        toggle.addEventListener('change', () => {
            label.textContent = toggle.checked ? "Activée" : "Désactivée";
            typeGroup.style.display = toggle.checked ? 'block' : 'none';
        });
    }
});

function letsGo() {
    validateAndGo();
}

// replaced old dead function with working generate
function oldGenerateThing() {
    triggerGeneration();
}

window.onload = init;
window.onresize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
};


