let scene, camera, renderer, stars, controls, centralSun;
let planets = [];

function toggleChat() {
    document.getElementById('chat-window').classList.toggle('active');
}

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 4000);
    camera.position.set(0, 250, 500);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const sunLight = new THREE.PointLight(0xffffff, 2.5, 1500);
    scene.add(sunLight);

    // Central "Soul" Star
    const sunGeo = new THREE.SphereGeometry(35, 64, 64);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    centralSun = new THREE.Mesh(sunGeo, sunMat);
    scene.add(centralSun);

    // Starfield
    const starGeo = new THREE.BufferGeometry();
    const starCoords = [];
    for (let i = 0; i < 15000; i++) {
        starCoords.push((Math.random() - 0.5) * 3000, (Math.random() - 0.5) * 3000, (Math.random() - 0.5) * 3000);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starCoords, 3));
    stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, transparent: true }));
    scene.add(stars);

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    stars.rotation.y += 0.0001;
    
    if(centralSun) {
        centralSun.scale.setScalar(1 + Math.sin(Date.now() * 0.002) * 0.05);
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

async function askAI() {
    const inputField = document.getElementById('user-input');
    const history = document.getElementById('chat-history');
    const text = inputField.value;
    if(!text) return;

    history.innerHTML += `<div class="user-msg">${text}</div>`;
    inputField.value = "";
    document.getElementById('mode-indicator').innerText = "🔮 SYNTHÈSE NEURONALE...";
    history.scrollTop = history.scrollHeight;

    try {
        const response = await fetch('http://localhost:3000/api/generate-universe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers: text })
        });

        const data = await response.json();
        history.innerHTML += `<div class="ai-msg">✦ Fréquences harmonisées. Déploiement du système terminé.</div>`;
        
        updateUniverse(data.planets);
        document.getElementById('mode-indicator').innerText = "✦ AI UNIVERSE";
    } catch (e) {
        history.innerHTML += `<div class="ai-msg" style="color:#ff4444">✕ Erreur critique : Liaison serveur rompue.</div>`;
    }
    history.scrollTop = history.scrollHeight;
}

function updateUniverse(aiData) {
    planets.forEach(p => scene.remove(p.group));
    planets = [];

    // Match Sun color to the first planet's vibe
    if(aiData.length > 0) {
        centralSun.material.color.setHex(parseInt(aiData[0].color, 16));
    }

    aiData.forEach(p => {
        const group = new THREE.Group();
        
        // Planet
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(p.size, 32, 32),
            new THREE.MeshStandardMaterial({ 
                color: parseInt(p.color, 16), 
                metalness: 0.3, 
                roughness: 0.7 
            })
        );
        group.add(mesh);

        // Atmosphere
        if(p.hasClouds) {
            const cloudGeo = new THREE.SphereGeometry(p.size + 0.6, 32, 32);
            const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 });
            group.add(new THREE.Mesh(cloudGeo, cloudMat));
        }

        // Rings
        if(p.hasRings) {
            const ring = new THREE.Mesh(
                new THREE.RingGeometry(p.size * 1.6, p.size * 2.5, 64),
                new THREE.MeshStandardMaterial({ color: parseInt(p.color, 16), side: THREE.DoubleSide, transparent: true, opacity: 0.4 })
            );
            ring.rotation.x = Math.PI/2.2;
            group.add(ring);
        }

        const pObj = { group, distance: p.dist, speed: p.speed, angle: Math.random() * Math.PI * 2 };
        planets.push(pObj);
        scene.add(group);
    });
}

window.onload = init;
window.onresize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
};