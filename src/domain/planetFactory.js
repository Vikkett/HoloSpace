import Planet from './planet.js';

export function createPlanets() {
    return [
        new Planet({
            name: 'Mercury',
            size: 3,
            distance: 50,
            orbitSpeed: 0.02,
            rotationSpeed: 0.01,
            color: 0xaaaaaa,
            texture: 'textures/mercury.jpg'
        }),

        new Planet({
            name: 'Venus',
            size: 5,
            distance: 80,
            orbitSpeed: 0.015,
            rotationSpeed: 0.008,
            color: 0xffd700,
            texture: 'textures/venus.jpg'
        }),

        new Planet({
            name: 'Earth',
            size: 6,
            distance: 110,
            orbitSpeed: 0.01,
            rotationSpeed: 0.01,
            color: 0x0066ff,
            texture: 'textures/earth.jpg'
        })
    ];
}