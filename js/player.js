class Player {
    constructor(camera, world, scene) {
        this.camera = camera;
        this.world = world;
        this.scene = scene;
        this.velocity = new THREE.Vector3();
        // Aparecer sobre la Av. 9 de Julio, mirando al Obelisco
        // (se puede aparecer en otro lado con ?x=...&z=...)
        const q = new URLSearchParams(location.search);
        const sx = parseFloat(q.get('x'));
        const sz = parseFloat(q.get('z'));
        if (!isNaN(sx) || !isNaN(sz)) {
            this.position = new THREE.Vector3(isNaN(sx) ? 6 : sx, 45, isNaN(sz) ? 30 : sz);
        } else {
            this.position = new THREE.Vector3(6, 26, 30);
        }

        this.yaw = 0;
        this.pitch = 0;
        this.mouseSensitivity = 0.002;

        // 0 = primera persona, 1 = tercera persona (se puede arrancar con ?vista=3)
        this.cameraMode = new URLSearchParams(location.search).get('vista') === '3' ? 1 : 0;
        this.thirdPersonDistance = 4.5;

        this.keys = {};
        this.flying = false;
        this.isGrounded = false;
        this.jumpPower = 0.15;
        this.moveSpeed = 0.15;
        this.friction = 0.8;
        this.gravity = -0.01;
        this.selectedBlock = 1; // Grass

        this.lastBreakTime = 0;
        this.lastPlaceTime = 0;
        this.breakCooldown = 100;
        this.placeCooldown = 100;

        this.createPlayerModel();
        this.setupControls();
        this.updateCamera();
    }

    createPlayerModel() {
        const group = new THREE.Group();

        const addBox = (w, h, d, color, x, y, z) => {
            const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(w, h, d),
                new THREE.MeshLambertMaterial({ color })
            );
            mesh.position.set(x, y, z);
            group.add(mesh);
            return mesh;
        };

        // Piernas (pantalón azul oscuro)
        addBox(0.24, 0.75, 0.24, 0x2a2a6e, -0.13, 0.375, 0);
        addBox(0.24, 0.75, 0.24, 0x2a2a6e, 0.13, 0.375, 0);
        // Torso (remera celeste)
        addBox(0.5, 0.75, 0.25, 0x2e8bc0, 0, 1.125, 0);
        // Brazos (piel en las puntas quedaría mejor, pero simple)
        addBox(0.24, 0.75, 0.24, 0x2e8bc0, -0.38, 1.125, 0);
        addBox(0.24, 0.75, 0.24, 0x2e8bc0, 0.38, 1.125, 0);
        // Cabeza (piel)
        addBox(0.5, 0.5, 0.5, 0xd8a988, 0, 1.75, 0);
        // Ojos (para saber hacia dónde mira: el frente es -Z)
        addBox(0.08, 0.08, 0.02, 0x222222, -0.12, 1.8, -0.26);
        addBox(0.08, 0.08, 0.02, 0x222222, 0.12, 1.8, -0.26);

        group.visible = false;
        this.scene.add(group);
        this.model = group;
    }

    getForward() {
        return new THREE.Vector3(
            -Math.sin(this.yaw) * Math.cos(this.pitch),
            Math.sin(this.pitch),
            -Math.cos(this.yaw) * Math.cos(this.pitch)
        );
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key === ' ') {
                e.preventDefault();
                this.jump();
            }
            if (e.key === 'Shift') {
                this.flying = !this.flying;
            }
            if (e.key.toLowerCase() === 'v') {
                this.cameraMode = this.cameraMode === 0 ? 1 : 0;
            }
            if (e.key >= '1' && e.key <= '5') {
                this.selectedBlock = parseInt(e.key);
                this.updateInventoryUI();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        document.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement !== document.body) return;
            this.yaw -= e.movementX * this.mouseSensitivity;
            this.pitch -= e.movementY * this.mouseSensitivity;
            const maxPitch = Math.PI / 2 - 0.01;
            this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
        });

        document.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.breakBlock();
            if (e.button === 2) this.placeBlock();
        });

        document.addEventListener('contextmenu', (e) => e.preventDefault());

        document.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY > 0) {
                this.selectedBlock = this.selectedBlock === 5 ? 1 : this.selectedBlock + 1;
            } else {
                this.selectedBlock = this.selectedBlock === 1 ? 5 : this.selectedBlock - 1;
            }
            this.updateInventoryUI();
        }, { passive: false });

        // Inventory slots
        document.querySelectorAll('.slot').forEach(slot => {
            slot.addEventListener('click', () => {
                this.selectedBlock = parseInt(slot.dataset.block);
                this.updateInventoryUI();
            });
        });

        // Lock pointer on click
        document.addEventListener('click', () => {
            if (document.pointerLockElement !== document.body) {
                document.body.requestPointerLock();
            }
        });
    }

    updateInventoryUI() {
        document.querySelectorAll('.slot').forEach(slot => {
            slot.classList.remove('selected');
            if (parseInt(slot.dataset.block) === this.selectedBlock) {
                slot.classList.add('selected');
            }
        });
    }

    jump() {
        if (this.flying) return;
        if (this.isGrounded) {
            this.velocity.y += this.jumpPower;
            this.isGrounded = false;
            if (typeof SFX !== 'undefined') SFX.saltar();
        }
    }

    breakBlock() {
        const now = Date.now();
        if (now - this.lastBreakTime < this.breakCooldown) return;
        this.lastBreakTime = now;

        const hit = this.raycastBlocks(5);
        if (hit) {
            this.world.setBlock(hit.block.x, hit.block.y, hit.block.z, BLOCKS.EMPTY);
            if (typeof SFX !== 'undefined') SFX.romper();
        }
    }

    placeBlock() {
        const now = Date.now();
        if (now - this.lastPlaceTime < this.placeCooldown) return;
        this.lastPlaceTime = now;

        const hit = this.raycastBlocks(5);
        if (hit && hit.prev) {
            // Colocar en la celda vacía justo antes del bloque impactado
            const px = hit.prev.x, py = hit.prev.y, pz = hit.prev.z;

            // No colocar un bloque encima del propio jugador
            const feetY = Math.floor(this.position.y - 1.6);
            const headY = Math.floor(this.position.y);
            const sameColumn = px === Math.round(this.position.x) && pz === Math.round(this.position.z);
            if (sameColumn && py >= feetY && py <= headY) return;

            this.world.setBlock(px, py, pz, this.selectedBlock);
            if (typeof SFX !== 'undefined') SFX.colocar();
        }
    }

    raycastBlocks(distance) {
        const direction = this.getForward();
        const step = 0.05;
        let prev = null;

        for (let d = 0; d < distance; d += step) {
            const point = this.position.clone().addScaledVector(direction, d);
            const bx = Math.round(point.x);
            const by = Math.round(point.y);
            const bz = Math.round(point.z);
            const block = this.world.getBlock(point.x, point.y, point.z);

            if (block !== BLOCKS.EMPTY) {
                return {
                    block: { x: bx, y: by, z: bz },
                    prev,
                    distance: d
                };
            }

            if (!prev || prev.x !== bx || prev.y !== by || prev.z !== bz) {
                prev = { x: bx, y: by, z: bz };
            }
        }

        return null;
    }

    updateCamera() {
        if (this.cameraMode === 0) {
            // Primera persona
            this.camera.position.copy(this.position);
            this.camera.rotation.order = 'YXZ';
            this.camera.rotation.set(this.pitch, this.yaw, 0);
            this.model.visible = false;
        } else {
            // Tercera persona: cámara detrás del jugador
            const forward = this.getForward();
            let dist = this.thirdPersonDistance;

            // Evitar que la cámara atraviese bloques
            for (let d = 0.5; d <= this.thirdPersonDistance; d += 0.25) {
                const p = this.position.clone().addScaledVector(forward, -d);
                if (this.world.getBlock(p.x, p.y, p.z) !== BLOCKS.EMPTY) {
                    dist = Math.max(0.5, d - 0.4);
                    break;
                }
            }

            this.camera.position.copy(this.position).addScaledVector(forward, -dist);
            this.camera.lookAt(this.position);
            this.model.visible = true;
        }

        // Posicionar el modelo (pies del jugador) y orientarlo según el yaw
        this.model.position.set(this.position.x, this.position.y - 1.6, this.position.z);
        this.model.rotation.y = this.yaw;
    }

    update() {
        const direction = new THREE.Vector3();

        if (this.keys['w']) direction.z -= 1;
        if (this.keys['s']) direction.z += 1;
        if (this.keys['a']) direction.x -= 1;
        if (this.keys['d']) direction.x += 1;

        if (direction.length() > 0) {
            direction.normalize();
            direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

            if (this.flying) {
                this.velocity.copy(direction).multiplyScalar(this.moveSpeed);
            } else {
                this.velocity.x = direction.x * this.moveSpeed;
                this.velocity.z = direction.z * this.moveSpeed;
            }
        } else {
            if (!this.flying) {
                this.velocity.x *= this.friction;
                this.velocity.z *= this.friction;
            } else {
                this.velocity.x = 0;
                this.velocity.z = 0;
                this.velocity.y = 0;
            }
        }

        if (this.flying) {
            if (this.keys[' ']) this.velocity.y = this.moveSpeed;
            if (this.keys['control']) this.velocity.y = -this.moveSpeed;
        } else {
            this.velocity.y += this.gravity;

            // Colisión simple
            this.isGrounded = false;
            const footPos = this.position.clone();
            footPos.y -= 1.6;

            if (this.world.getBlock(footPos.x, footPos.y, footPos.z) !== BLOCKS.EMPTY) {
                this.isGrounded = true;
                this.velocity.y = 0;
            } else {
                // Revisar los 4 puntos alrededor
                const checkPoints = [
                    new THREE.Vector3(0.3, -1.6, 0.3),
                    new THREE.Vector3(-0.3, -1.6, 0.3),
                    new THREE.Vector3(0.3, -1.6, -0.3),
                    new THREE.Vector3(-0.3, -1.6, -0.3)
                ];

                for (let point of checkPoints) {
                    const checkPos = this.position.clone().add(point);
                    if (this.world.getBlock(checkPos.x, checkPos.y, checkPos.z) !== BLOCKS.EMPTY) {
                        this.isGrounded = true;
                        this.velocity.y = 0;
                        break;
                    }
                }
            }
        }

        // Aplicar velocidad
        this.position.add(this.velocity);

        // Colisiones horizontales simples
        const checkBoxX = this.position.clone();
        checkBoxX.y += 0.8;
        if (this.world.getBlock(checkBoxX.x + (this.velocity.x > 0 ? 0.3 : -0.3), checkBoxX.y, checkBoxX.z) !== BLOCKS.EMPTY) {
            this.velocity.x = 0;
            this.position.x -= this.velocity.x;
        }

        const checkBoxZ = this.position.clone();
        checkBoxZ.y += 0.8;
        if (this.world.getBlock(checkBoxZ.x, checkBoxZ.y, checkBoxZ.z + (this.velocity.z > 0 ? 0.3 : -0.3)) !== BLOCKS.EMPTY) {
            this.velocity.z = 0;
            this.position.z -= this.velocity.z;
        }

        // Límite de altura
        if (this.position.y > 256) {
            this.position.y = 32;
            this.velocity.y = 0;
        }

        // Límite inferior
        if (this.position.y < -100) {
            this.position.set(6, 26, 30);
            this.velocity.set(0, 0, 0);
        }

        this.updateCamera();

        // Actualizar UI de coordenadas
        document.getElementById('coords').textContent =
            `X: ${Math.floor(this.position.x)} Y: ${Math.floor(this.position.y)} Z: ${Math.floor(this.position.z)}`;
    }
}
