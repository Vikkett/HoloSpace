const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 5000);
camera.position.set(0, 150, 400);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 20;
controls.maxDistance = 1000;

// BRIGHT LIGHTING - Multiple lights to see all planets
scene.add(new THREE.AmbientLight(0x404040, 2)); // Bright ambient

const sunLight = new THREE.PointLight(0xffffff, 3, 1000); // Strong sun
scene.add(sunLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1); // Fill light
dirLight.position.set(50, 100, 100);
scene.add(dirLight);

const planets = [];
const textureLoader = new THREE.TextureLoader();

// Helper to create planet with bright fallback color
function createPlanet(name, size, distance, orbitSpeed, colorHex, textureUrl, hasRings) {
    const group = new THREE.Group();
    
    // Create material with bright color fallback
    const material = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.3, // Glow so it's visible
        roughness: 0.5,
        metalness: 0.1
    });
    
    // Try to load texture (if fails, color stays)
    if (textureUrl) {
        textureLoader.load(
            textureUrl,
            function(texture) {
                material.map = texture;
                material.emissiveIntensity = 0.1; // Reduce glow when texture loads
                material.needsUpdate = true;
            },
            undefined,
            function(err) {
                console.log('Texture failed for ' + name + ', using color');
            }
        );
    }
    
    const geometry = new THREE.SphereGeometry(size, 32, 32);
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
    
    // Rings for Saturn
    if (hasRings) {
        const ringGeo = new THREE.RingGeometry(size * 1.4, size * 2.2, 64);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xffddaa,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6
        });
        const rings = new THREE.Mesh(ringGeo, ringMat);
        rings.rotation.x = Math.PI / 2;
        group.add(rings);
    }
    
    // Position
    const angle = Math.random() * Math.PI * 2;
    group.position.x = Math.cos(angle) * distance;
    group.position.z = Math.sin(angle) * distance;
    
    scene.add(group);
    
    planets.push({
        mesh: group,
        distance: distance,
        angle: angle,
        speed: orbitSpeed,
        rotSpeed: 0.01 + Math.random() * 0.01
    });
    
    return group;
}

// SUN - Bright orange/yellow
const sunGeo = new THREE.SphereGeometry(20, 32, 32);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
const sun = new THREE.Mesh(sunGeo, sunMat);

// Sun glow
const glowGeo = new THREE.SphereGeometry(25, 32, 32);
const glowMat = new THREE.MeshBasicMaterial({
    color: 0xff5500,
    transparent: true,
    opacity: 0.3
});
sun.add(new THREE.Mesh(glowGeo, glowMat));

scene.add(sun);
planets.push({ mesh: sun, isSun: true, rotSpeed: 0.002 });

// Create all planets with BRIGHT colors
// Mercury - Gray
createPlanet('mercury', 3, 50, 0.02, 0xaaaaaa, 
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/mercury_2048.jpg');

// Venus - Yellow/Gold
createPlanet('venus', 5, 80, 0.015, 0xffd700,
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/venus_2048.jpg');

// Earth - Blue (you said this one works)
createPlanet('earth', 6, 110, 0.01, 0x0066ff,
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg');

// Mars - Red
createPlanet('mars', 4, 140, 0.008, 0xff4500,
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/mars_2048.jpg');

// Jupiter - Orange/Tan
createPlanet('jupiter', 14, 190, 0.004, 0xd4a574,
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/jupiter_2048.jpg');

// Saturn - Pale yellow with rings
createPlanet('saturn', 12, 250, 0.003, 0xf4e4c1,
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/saturn_2048.jpg', true);

// Uranus - Cyan
createPlanet('uranus', 8, 310, 0.002, 0x40e0d0,
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/uranus_2048.jpg');

// Neptune - Blue
createPlanet('neptune', 7.5, 370, 0.001, 0x4169e1,
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/neptune_2048.jpg');

// Stars
const starsGeo = new THREE.BufferGeometry();
const starsCount = 5000;
const posArray = new Float32Array(starsCount * 3);
for(let i = 0; i < starsCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 2000;
}
starsGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const stars = new THREE.Points(starsGeo, new THREE.PointsMaterial({size: 2, color: 0xffffff}));
scene.add(stars);

// Animation
function animate() {
    requestAnimationFrame(animate);
    
    planets.forEach(function(p) {
        if (p.isSun) {
            p.mesh.rotation.y += p.rotSpeed;
        } else {
            // Orbit
            p.angle += p.speed;
            p.mesh.position.x = Math.cos(p.angle) * p.distance;
            p.mesh.position.z = Math.sin(p.angle) * p.distance;
            // Rotate
            p.mesh.rotation.y += p.rotSpeed;
        }
    });
    
    controls.update();
    renderer.render(scene, camera);
}

animate();

window.onresize = function() {
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
};