import { World } from './world.js';
import { Player } from './player.js';

let scene, camera, renderer, world, player;

function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 300, 500);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(8, 40, 8);

    // Renderer
    const container = document.getElementById('game-container');
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowShadowMap;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -200;
    directionalLight.shadow.camera.right = 200;
    directionalLight.shadow.camera.top = 200;
    directionalLight.shadow.camera.bottom = -200;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    scene.add(directionalLight);

    // World
    world = new World(scene);

    // Player
    player = new Player(camera, world);

    // Initial chunk loading
    world.updateChunksAround(player.position.x, player.position.z);

    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    // FPS counter
    let frameCount = 0;
    let lastTime = Date.now();

    // Game loop
    function animate() {
        requestAnimationFrame(animate);

        // Update
        player.update();
        world.updateChunksAround(player.position.x, player.position.z);

        // FPS counter
        frameCount++;
        const currentTime = Date.now();
        if (currentTime - lastTime >= 1000) {
            document.getElementById('fps').textContent = `FPS: ${frameCount}`;
            frameCount = 0;
            lastTime = currentTime;
        }

        // Render
        renderer.render(scene, camera);
    }

    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Start the game
init();
