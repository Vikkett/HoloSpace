import * as THREE from 'three';

export default class SceneManager {

    constructor() {

        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            5000
        );

        this.camera.position.set(0, 150, 400);

        this.renderer = new THREE.WebGLRenderer({
            antialias: true
        });

        this.renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );

        document.body.appendChild(
            this.renderer.domElement
        );

        this.setupLights();
    }

    setupLights() {

        const ambient = new THREE.AmbientLight(
            0x404040,
            2
        );

        this.scene.add(ambient);

        const sunLight = new THREE.PointLight(
            0xffffff,
            3,
            1000
        );

        this.scene.add(sunLight);
    }

    render() {
        this.renderer.render(
            this.scene,
            this.camera
        );
    }
}