import * as THREE from 'three';

export default class TextureRepository {
    constructor() {
        this.loader = new THREE.TextureLoader();
        this.cache = new Map();
    }

    load(path) {
        return new Promise((resolve, reject) => {

            if (this.cache.has(path)) {
                resolve(this.cache.get(path));
                return;
            }

            this.loader.load(
                path,
                texture => {
                    this.cache.set(path, texture);
                    resolve(texture);
                },
                undefined,
                reject
            );
        });
    }
}