const CHUNK_SIZE = 16;
const CHUNK_HEIGHT = 64;

// --- Parámetros de la ciudad (estilo CABA) ---
const GROUND = 20;          // Nivel de la calle
const MANZANA = 16;         // Período de la cuadrícula (manzana + calle)
const CALLE = 4;            // Ancho de las calles
const AV_9_JULIO = 12;      // Media anchura de la Av. 9 de Julio (en x = 0)
const RIO_Z = -56;          // Desde acá hacia el norte: Río de la Plata
const COSTANERA_Z = -44;    // Franja de costanera/playa antes del río

// Hash determinístico: la ciudad es siempre la misma
function cityHash(x, z) {
    let n = (x * 73856093) ^ (z * 19349663);
    n = ((n << 13) ^ n) | 0;
    n = (n * (n * n * 15731 + 789221) + 1376312589) | 0;
    return Math.abs(n);
}

class World {
    constructor(scene) {
        this.scene = scene;
        this.chunks = new Map();
        this.chunkGroup = new THREE.Group();
        scene.add(this.chunkGroup);
    }

    getChunkKey(chunkX, chunkZ) {
        return `${chunkX},${chunkZ}`;
    }

    // Información de la manzana a la que pertenece una columna
    manzanaInfo(wx, wz) {
        const mx = Math.floor(wx / MANZANA);
        const mz = Math.floor(wz / MANZANA);
        const lx = wx - mx * MANZANA; // 0..15
        const lz = wz - mz * MANZANA;

        const esCalle = lx < CALLE || lz < CALLE;
        const esVereda = !esCalle && (lx === CALLE || lx === MANZANA - 1 || lz === CALLE || lz === MANZANA - 1);
        const h = cityHash(mx, mz);
        const esPlaza = h % 6 === 0;

        // Altura del edificio: 4 a 21 pisos, determinística por manzana
        const altura = 4 + (h % 18);

        // Paleta del edificio por manzana
        const paletas = [BLOCKS.BUILDING_A, BLOCKS.BUILDING_B, BLOCKS.BUILDING_C];
        const material = paletas[h % 3];

        return { esCalle, esVereda, esPlaza, altura, material, lx, lz };
    }

    // Genera una columna (x,z) del mundo en el array de voxels del chunk
    generateColumn(voxels, x, z, wx, wz) {
        const setV = (y, block) => {
            if (y < 0 || y >= CHUNK_HEIGHT) return;
            voxels[x + y * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_HEIGHT] = block;
        };

        // --- Río de la Plata (norte) ---
        if (wz < RIO_Z) {
            for (let y = 0; y <= 12; y++) setV(y, BLOCKS.STONE);
            for (let y = 13; y <= GROUND - 2; y++) setV(y, BLOCKS.WATER);
            return;
        }

        // Subsuelo común
        for (let y = 0; y <= GROUND - 3; y++) setV(y, BLOCKS.STONE);
        setV(GROUND - 2, BLOCKS.DIRT);
        setV(GROUND - 1, BLOCKS.DIRT);

        // --- Costanera (bajada de arena hacia el río) ---
        if (wz < COSTANERA_Z) {
            setV(GROUND, BLOCKS.SAND);
            return;
        }

        // --- Obelisco y su plaza (en el origen) ---
        const dx = Math.abs(wx);
        const dz = Math.abs(wz);
        if (dx <= 5 && dz <= 5) {
            setV(GROUND, BLOCKS.MARBLE);
            if (dx <= 1 && dz <= 1) {
                // Cuerpo del obelisco
                for (let y = GROUND + 1; y <= GROUND + 26; y++) setV(y, BLOCKS.MARBLE);
            }
            if (wx === 0 && wz === 0) {
                // Punta
                for (let y = GROUND + 27; y <= GROUND + 32; y++) setV(y, BLOCKS.MARBLE);
            }
            return;
        }

        // --- Avenida 9 de Julio (eje norte-sur en x = 0) ---
        if (dx <= AV_9_JULIO) {
            if (dx <= 2) {
                // Cantero central con pasto
                setV(GROUND, BLOCKS.GRASS);
            } else {
                setV(GROUND, BLOCKS.ASPHALT);
            }
            return;
        }

        // --- Cuadrícula de manzanas ---
        const m = this.manzanaInfo(wx, wz);

        if (m.esCalle) {
            setV(GROUND, BLOCKS.ASPHALT);
            return;
        }

        if (m.esVereda) {
            setV(GROUND, BLOCKS.SIDEWALK);
            return;
        }

        if (m.esPlaza) {
            // Plaza con árboles
            setV(GROUND, BLOCKS.GRASS);

            const esTronco = ((wx % 5) + 5) % 5 === 2 && ((wz % 5) + 5) % 5 === 2;
            if (esTronco) {
                setV(GROUND + 1, BLOCKS.WOOD);
                setV(GROUND + 2, BLOCKS.WOOD);
                setV(GROUND + 3, BLOCKS.WOOD);
            }

            // Copa: hojas alrededor de cualquier tronco vecino
            let cercaDeTronco = false;
            for (let ox = -1; ox <= 1 && !cercaDeTronco; ox++) {
                for (let oz = -1; oz <= 1; oz++) {
                    const tx = wx + ox, tz = wz + oz;
                    if (((tx % 5) + 5) % 5 === 2 && ((tz % 5) + 5) % 5 === 2) {
                        cercaDeTronco = true;
                        break;
                    }
                }
            }
            if (cercaDeTronco) {
                setV(GROUND + 4, BLOCKS.LEAVES);
                setV(GROUND + 5, BLOCKS.LEAVES);
            }
            return;
        }

        // --- Edificio ---
        setV(GROUND, BLOCKS.SIDEWALK);
        for (let y = GROUND + 1; y <= GROUND + m.altura; y++) {
            const piso = y - (GROUND + 1);
            const esVentana = piso % 3 === 1 && ((wx + wz) % 2 === 0);
            setV(y, esVentana ? BLOCKS.WINDOW : m.material);
        }
        // Azotea
        setV(GROUND + m.altura + 1, BLOCKS.SIDEWALK);
    }

    generateTerrain(chunkX, chunkZ) {
        const voxels = new Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE).fill(BLOCKS.EMPTY);

        for (let x = 0; x < CHUNK_SIZE; x++) {
            for (let z = 0; z < CHUNK_SIZE; z++) {
                const wx = chunkX * CHUNK_SIZE + x;
                const wz = chunkZ * CHUNK_SIZE + z;
                this.generateColumn(voxels, x, z, wx, wz);
            }
        }

        return voxels;
    }

    createChunkMesh(chunkX, chunkZ, voxels) {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const colors = [];

        for (let x = 0; x < CHUNK_SIZE; x++) {
            for (let y = 0; y < CHUNK_HEIGHT; y++) {
                for (let z = 0; z < CHUNK_SIZE; z++) {
                    const index = x + y * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_HEIGHT;
                    const block = voxels[index];

                    if (block === BLOCKS.EMPTY) continue;

                    const blockColor = getBlockColor(block);
                    const r = (blockColor >> 16) & 255;
                    const g = (blockColor >> 8) & 255;
                    const b = blockColor & 255;

                    // Revisar faces expuestas
                    const faces = [
                        [x + 1, y, z],
                        [x - 1, y, z],
                        [x, y + 1, z],
                        [x, y - 1, z],
                        [x, y, z + 1],
                        [x, y, z - 1]
                    ];

                    let expuesto = false;
                    for (const [fx, fy, fz] of faces) {
                        if (fx < 0 || fx >= CHUNK_SIZE || fy < 0 || fy >= CHUNK_HEIGHT || fz < 0 || fz >= CHUNK_SIZE) {
                            expuesto = true;
                            break;
                        }
                        const neighborIndex = fx + fy * CHUNK_SIZE + fz * CHUNK_SIZE * CHUNK_HEIGHT;
                        if (voxels[neighborIndex] === BLOCKS.EMPTY) {
                            expuesto = true;
                            break;
                        }
                    }

                    if (expuesto) {
                        this.addFace(vertices, colors, x, y, z, r, g, b);
                    }
                }
            }
        }

        if (vertices.length === 0) return null;

        const positions = new Float32Array(vertices);
        const colorArray = new Uint8Array(colors);

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3, true));

        const material = new THREE.MeshPhongMaterial({
            vertexColors: true,
            flatShading: true,
            side: THREE.FrontSide
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
            chunkX * CHUNK_SIZE,
            0,
            chunkZ * CHUNK_SIZE
        );

        return mesh;
    }

    addFace(vertices, colors, x, y, z, r, g, b) {
        const cubeVertices = [
            [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], // front
            [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]  // back
        ];

        const faces = [
            [0, 1, 2, 2, 3, 0], // front
            [5, 4, 7, 7, 6, 5], // back
            [4, 0, 3, 3, 7, 4], // left
            [1, 5, 6, 6, 2, 1], // right
            [3, 2, 6, 6, 7, 3], // top
            [4, 5, 1, 1, 0, 4]  // bottom
        ];

        const brightness = [0.7, 0.7, 0.6, 0.8, 1.0, 0.5];

        faces.forEach((face, faceIdx) => {
            const br = brightness[faceIdx];
            face.forEach(idx => {
                vertices.push(x + cubeVertices[idx][0]);
                vertices.push(y + cubeVertices[idx][1]);
                vertices.push(z + cubeVertices[idx][2]);

                colors.push(Math.min(255, r * br));
                colors.push(Math.min(255, g * br));
                colors.push(Math.min(255, b * br));
            });
        });
    }

    loadChunk(chunkX, chunkZ) {
        const key = this.getChunkKey(chunkX, chunkZ);
        if (this.chunks.has(key)) return;

        const voxels = this.generateTerrain(chunkX, chunkZ);
        const mesh = this.createChunkMesh(chunkX, chunkZ, voxels);

        if (mesh) {
            this.chunkGroup.add(mesh);
        }

        this.chunks.set(key, {
            voxels,
            mesh,
            x: chunkX,
            z: chunkZ
        });
    }

    updateChunksAround(playerX, playerZ) {
        const chunkX = Math.floor(playerX / CHUNK_SIZE);
        const chunkZ = Math.floor(playerZ / CHUNK_SIZE);
        const renderDistance = 3;

        for (let x = chunkX - renderDistance; x <= chunkX + renderDistance; x++) {
            for (let z = chunkZ - renderDistance; z <= chunkZ + renderDistance; z++) {
                this.loadChunk(x, z);
            }
        }
    }

    getBlock(x, y, z) {
        const chunkX = Math.floor(x / CHUNK_SIZE);
        const chunkZ = Math.floor(z / CHUNK_SIZE);
        const localX = Math.floor(x - chunkX * CHUNK_SIZE);
        const localZ = Math.floor(z - chunkZ * CHUNK_SIZE);
        const localY = Math.floor(y);

        if (localY < 0 || localY >= CHUNK_HEIGHT) return BLOCKS.EMPTY;

        const key = this.getChunkKey(chunkX, chunkZ);
        const chunk = this.chunks.get(key);

        if (!chunk) return BLOCKS.EMPTY;

        const index = localX + localY * CHUNK_SIZE + localZ * CHUNK_SIZE * CHUNK_HEIGHT;
        return chunk.voxels[index] || BLOCKS.EMPTY;
    }

    setBlock(x, y, z, blockType) {
        const chunkX = Math.floor(x / CHUNK_SIZE);
        const chunkZ = Math.floor(z / CHUNK_SIZE);
        const localX = Math.floor(x - chunkX * CHUNK_SIZE);
        const localZ = Math.floor(z - chunkZ * CHUNK_SIZE);
        const localY = Math.floor(y);

        if (localY < 0 || localY >= CHUNK_HEIGHT) return;

        const key = this.getChunkKey(chunkX, chunkZ);
        const chunk = this.chunks.get(key);

        if (!chunk) return;

        const index = localX + localY * CHUNK_SIZE + localZ * CHUNK_SIZE * CHUNK_HEIGHT;
        chunk.voxels[index] = blockType;

        // Regenerar mesh del chunk
        if (chunk.mesh) {
            this.chunkGroup.remove(chunk.mesh);
            chunk.mesh.geometry.dispose();
            chunk.mesh.material.dispose();
        }

        const newMesh = this.createChunkMesh(chunkX, chunkZ, chunk.voxels);
        if (newMesh) {
            this.chunkGroup.add(newMesh);
            chunk.mesh = newMesh;
        }
    }
}
