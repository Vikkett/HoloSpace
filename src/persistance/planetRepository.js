export default class PlanetRepository {

    getPlanetData() {
        return [
            {
                name: 'Mercury',
                texture:
                    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/mercury_2048.jpg'
            },

            {
                name: 'Earth',
                texture:
                    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg'
            }
        ];
    }
}