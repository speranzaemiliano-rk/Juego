import { BLOCKS, BLOCK_TEXTURES, getBlockColor } from './blocks.js';

const CHUNK_SIZE = 16;
const CHUNK_HEIGHT = 64;
const TERRAIN_SCALE = 50;

class SimplexNoise {
    constructor(seed = 0) {
        this.seed = seed;
    }

    noise(x, y) {
        const n = Math.sin(x * 12.9898 + y * 78.233 + this.seed) * 43758.5453;
        return n - Math.floor(n);
    }
}

export class World {
    constructor(scene) {
        this.scene = scene;
        this.chunks = new Map();
        this.noise = new SimplexNoise(Math.random() * 1000);
        this.chunkGroup = new THREE.Group();
        scene.add(this.chunkGroup);
    }

    getChunkKey(chunkX, chunkZ) {
        return `${chunkX},${chunkZ}`;
    }

    generateTerrain(chunkX, chunkZ) {
        const voxels = new Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE).fill(BLOCKS.EMPTY);

        for (let x = 0; x < CHUNK_SIZE; x++) {
            for (let z = 0; z < CHUNK_SIZE; z++) {
                const worldX = chunkX * CHUNK_SIZE + x;
                const worldZ = chunkZ * CHUNK_SIZE + z;

                let height = 32;
                height += this.noise.noise(worldX / TERRAIN_SCALE, worldZ / TERRAIN_SCALE) * 10;
                height += this.noise.noise(worldX / (TERRAIN_SCALE * 2), worldZ / (TERRAIN_SCALE * 2)) * 5;

                for (let y = 0; y < CHUNK_HEIGHT; y++) {
                    const index = x + y * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_HEIGHT;

                    if (y < height - 2) {
                        voxels[index] = BLOCKS.STONE;
                    } else if (y < height - 1) {
                        voxels[index] = BLOCKS.DIRT;
                    } else if (y < height) {
                        voxels[index] = BLOCKS.GRASS;
                    } else if (y < height + 1 && Math.random() > 0.7) {
                        voxels[index] = BLOCKS.SAND;
                    }
                }
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

                    faces.forEach(([fx, fy, fz]) => {
                        if (fx < 0 || fx >= CHUNK_SIZE || fy < 0 || fy >= CHUNK_HEIGHT || fz < 0 || fz >= CHUNK_SIZE) {
                            // Cara expuesta (borde del chunk)
                            this.addFace(vertices, colors, x, y, z, r, g, b);
                            return;
                        }

                        const neighborIndex = fx + fy * CHUNK_SIZE + fz * CHUNK_SIZE * CHUNK_HEIGHT;
                        if (voxels[neighborIndex] === BLOCKS.EMPTY) {
                            this.addFace(vertices, colors, x, y, z, r, g, b);
                        }
                    });
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
            face.forEach(idx => {
                vertices.push(x + cubeVertices[idx][0]);
                vertices.push(y + cubeVertices[idx][1]);
                vertices.push(z + cubeVertices[idx][2]);

                const b = brightness[faceIdx];
                colors.push(Math.min(255, r * b));
                colors.push(Math.min(255, g * b));
                colors.push(Math.min(255, b * b));
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
        const renderDistance = 2;

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
