import * as THREE from 'three';

export default class PlanetRenderer {

    constructor(scene, textureRepository) {
        this.scene = scene;
        this.textureRepository = textureRepository;
        this.meshes = new Map();
    }

    async renderPlanet(planet) {

        const geometry =
            new THREE.SphereGeometry(
                planet.size,
                32,
                32
            );

        const material =
            new THREE.MeshStandardMaterial({
                color: planet.color,
                emissive: planet.color,
                emissiveIntensity: 0.2
            });

        if (planet.texture) {
            try {
                material.map =
                    await this.textureRepository.load(
                        planet.texture
                    );
            } catch (e) {
                console.log(
                    `Texture failed for ${planet.name}`
                );
            }
        }

        const mesh =
            new THREE.Mesh(geometry, material);

        mesh.position.set(
            planet.position.x,
            0,
            planet.position.z
        );

        this.scene.add(mesh);

        this.meshes.set(planet.name, mesh);
    }

    update(planets) {

        planets.forEach(planet => {

            const mesh =
                this.meshes.get(planet.name);

            if (!mesh) return;

            mesh.position.x = planet.position.x;
            mesh.position.z = planet.position.z;

            mesh.rotation.y +=
                planet.rotationSpeed;
        });
    }
}