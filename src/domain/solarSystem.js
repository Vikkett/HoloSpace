export default class SolarSystem {
    constructor(planets = []) {
        this.planets = planets;
    }

    update() {
        this.planets.forEach(planet => {
            planet.update();
        });
    }
}