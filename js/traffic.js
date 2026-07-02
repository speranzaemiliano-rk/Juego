// Tráfico: autos y colectivos circulando por la Av. 9 de Julio
class Traffic {
    constructor(scene) {
        this.cars = [];

        const coloresAutos = [0xd94040, 0xf0f0f0, 0x4090d9, 0x3a3a3a, 0x40b060, 0xe8b820];

        // Carriles de la avenida: a la izquierda van hacia el norte, a la derecha hacia el sur
        const carriles = [
            { x: -9.5, dir: -1 },
            { x: -6.5, dir: -1 },
            { x: 6.5, dir: 1 },
            { x: 9.5, dir: 1 }
        ];

        let n = 0;
        for (const carril of carriles) {
            for (let j = 0; j < 4; j++) {
                const esColectivo = n % 5 === 0;
                const car = this.makeCar(coloresAutos[n % coloresAutos.length], esColectivo);
                car.position.set(carril.x, 21, -45 + ((n * 37 + j * 61) % 170));
                car.rotation.y = carril.dir > 0 ? 0 : Math.PI;
                car.userData = {
                    dir: carril.dir,
                    speed: esColectivo ? 0.09 : 0.12 + 0.03 * (j % 3)
                };
                scene.add(car);
                this.cars.push(car);
                n++;
            }
        }
    }

    makeCar(color, esColectivo) {
        const g = new THREE.Group();
        const mat = (c) => new THREE.MeshLambertMaterial({ color: c });

        if (esColectivo) {
            // Colectivo rojo y blanco
            const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.6, 4.4), mat(0xc23030));
            cuerpo.position.y = 1.15;
            g.add(cuerpo);
            const franja = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.45, 4.45), mat(0xf5f5f5));
            franja.position.y = 1.35;
            g.add(franja);
            const parabrisas = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.6, 0.1), mat(0x9adbe8));
            parabrisas.position.set(0, 1.55, 2.2);
            g.add(parabrisas);
        } else {
            const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.55, 2.4), mat(color));
            cuerpo.position.y = 0.6;
            g.add(cuerpo);
            const techo = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.5, 1.2), mat(color));
            techo.position.set(0, 1.1, -0.1);
            g.add(techo);
        }

        // Ruedas
        const largo = esColectivo ? 1.5 : 0.8;
        [[-0.6, -largo], [0.6, -largo], [-0.6, largo], [0.6, largo]].forEach(([x, z]) => {
            const rueda = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.4, 0.5), mat(0x141414));
            rueda.position.set(x, 0.2, z);
            g.add(rueda);
        });

        return g;
    }

    update() {
        for (const car of this.cars) {
            car.position.z += car.userData.dir * car.userData.speed;
            // Dar la vuelta antes de llegar al río y lejos al sur
            if (car.position.z > 125) car.position.z = -45;
            if (car.position.z < -45) car.position.z = 125;
        }
    }
}
