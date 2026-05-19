export default class Planet {
    constructor({
        name,
        size,
        distance,
        orbitSpeed,
        rotationSpeed,
        color,
        texture,
        hasRings = false
    }) {
        this.name = name;
        this.size = size;
        this.distance = distance;
        this.orbitSpeed = orbitSpeed;
        this.rotationSpeed = rotationSpeed;
        this.color = color;
        this.texture = texture;
        this.hasRings = hasRings;

        this.angle = Math.random() * Math.PI * 2;

        this.position = {
            x: Math.cos(this.angle) * distance,
            z: Math.sin(this.angle) * distance
        };
    }

    update() {
        this.angle += this.orbitSpeed;

        this.position.x = Math.cos(this.angle) * this.distance;
        this.position.z = Math.sin(this.angle) * this.distance;
    }
}