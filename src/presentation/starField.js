import * as THREE from 'three';

export default function createStars(scene) {

    const geometry =
        new THREE.BufferGeometry();

    const count = 5000;

    const positions =
        new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i++) {
        positions[i] =
            (Math.random() - 0.5) * 2000;
    }

    geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(
            positions,
            3
        )
    );

    const material =
        new THREE.PointsMaterial({
            size: 2,
            color: 0xffffff
        });

    const stars =
        new THREE.Points(
            geometry,
            material
        );

    scene.add(stars);
}