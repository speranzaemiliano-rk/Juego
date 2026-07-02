class Player {
    constructor(camera, world) {
        this.camera = camera;
        this.world = world;
        this.velocity = new THREE.Vector3();
        this.position = new THREE.Vector3(8, 40, 8);
        this.camera.position.copy(this.position);

        this.keys = {};
        this.flying = false;
        this.isGrounded = false;
        this.jumpPower = 0.15;
        this.moveSpeed = 0.15;
        this.friction = 0.8;
        this.gravity = -0.01;
        this.selectedBlock = 1; // Grass

        this.raycaster = new THREE.Raycaster();
        this.lastBreakTime = 0;
        this.lastPlaceTime = 0;
        this.breakCooldown = 100;
        this.placeCooldown = 100;

        this.setupControls();
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
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
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
        });

        // Inventory slots
        document.querySelectorAll('.slot').forEach(slot => {
            slot.addEventListener('click', () => {
                this.selectedBlock = parseInt(slot.dataset.block);
                this.updateInventoryUI();
            });
        });

        // Lock pointer on click
        document.addEventListener('click', () => {
            document.body.requestPointerLock = document.body.requestPointerLock || document.body.mozRequestPointerLock;
            document.body.requestPointerLock();
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
        }
    }

    breakBlock() {
        const now = Date.now();
        if (now - this.lastBreakTime < this.breakCooldown) return;
        this.lastBreakTime = now;

        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.camera.quaternion);
        this.raycaster.set(this.camera.position, direction);

        const blocks = this.raycastBlocks(5);
        if (blocks.length > 0) {
            const block = blocks[0];
            this.world.setBlock(block.x, block.y, block.z, BLOCKS.EMPTY);
        }
    }

    placeBlock() {
        const now = Date.now();
        if (now - this.lastPlaceTime < this.placeCooldown) return;
        this.lastPlaceTime = now;

        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.camera.quaternion);
        this.raycaster.set(this.camera.position, direction);

        const blocks = this.raycastBlocks(5);
        if (blocks.length > 0) {
            const block = blocks[0];
            // Colocar bloque adelante del bloque roto
            const offset = direction.clone().normalize().multiplyScalar(1.1);
            const newX = block.x + offset.x;
            const newY = block.y + offset.y;
            const newZ = block.z + offset.z;

            this.world.setBlock(
                Math.round(newX),
                Math.round(newY),
                Math.round(newZ),
                this.selectedBlock
            );
        }
    }

    raycastBlocks(distance) {
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.camera.quaternion);

        const blocks = [];
        const step = 0.1;

        for (let d = 0; d < distance; d += step) {
            const point = this.camera.position.clone().addScaledVector(direction, d);
            const block = this.world.getBlock(point.x, point.y, point.z);

            if (block !== BLOCKS.EMPTY) {
                blocks.push({
                    x: Math.round(point.x),
                    y: Math.round(point.y),
                    z: Math.round(point.z),
                    distance: d
                });
                break;
            }
        }

        return blocks;
    }

    update() {
        const direction = new THREE.Vector3();

        if (this.keys['w']) direction.z -= 1;
        if (this.keys['s']) direction.z += 1;
        if (this.keys['a']) direction.x -= 1;
        if (this.keys['d']) direction.x += 1;

        if (direction.length() > 0) {
            direction.normalize();
            direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.camera.rotation.y);

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
            this.position.y = 32;
            this.position.x = 8;
            this.position.z = 8;
            this.velocity.set(0, 0, 0);
        }

        // Actualizar cámara
        this.camera.position.copy(this.position);

        // Actualizar UI de coordenadas
        document.getElementById('coords').textContent =
            `X: ${Math.floor(this.position.x)} Y: ${Math.floor(this.position.y)} Z: ${Math.floor(this.position.z)}`;
    }
}
