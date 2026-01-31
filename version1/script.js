import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

// ==========================================
// CONFIGURACIÓN (Variables editables)
// ==========================================
const CONFIG = {
    colorFondo: 0x000000,      // Fondo negro
    colorLineas: 0xffffff,     // Líneas blancas
    tamanoEspacio: 800,        // Tamaño total del cubo
    divisiones: 15,            // Cantidad de divisiones de la cuadrícula
    velocidadRotacionX: 0.001, // Velocidad de giro suave en eje X
    velocidadRotacionY: 0.002, // Velocidad de giro suave en eje Y
    campoDeVision: 75          // FOV de la cámara
};

// ==========================================
// INICIALIZACIÓN DE THREE.JS
// ==========================================

// 1. Escena
const scene = new THREE.Scene();
scene.background = new THREE.Color(CONFIG.colorFondo);
// Niebla para profundidad
scene.fog = new THREE.Fog(CONFIG.colorFondo, 100, CONFIG.tamanoEspacio * 1.5);

// 2. Cámara
const camera = new THREE.PerspectiveCamera(
    CONFIG.campoDeVision, 
    window.innerWidth / window.innerHeight, 
    1, 
    2000
);
camera.position.z = 600;

// 3. Renderizador
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Limpieza preventiva por si el canvas ya existe
const existingCanvas = document.querySelector('canvas');
if (existingCanvas) existingCanvas.remove();

document.body.appendChild(renderer.domElement);

// ==========================================
// CREACIÓN DE LA MATRIZ (LÍNEAS)
// ==========================================

const geometry = new THREE.BufferGeometry();
const positions = [];

const step = CONFIG.tamanoEspacio / CONFIG.divisiones;
const halfSize = CONFIG.tamanoEspacio / 2;

for (let i = 0; i <= CONFIG.divisiones; i++) {
    const u = -halfSize + i * step;

    for (let j = 0; j <= CONFIG.divisiones; j++) {
        const v = -halfSize + j * step;

        // Línea paralela al eje X
        positions.push(-halfSize, u, v);
        positions.push(halfSize, u, v);

        // Línea paralela al eje Y
        positions.push(u, -halfSize, v);
        positions.push(u, halfSize, v);

        // Línea paralela al eje Z
        positions.push(u, v, -halfSize);
        positions.push(u, v, halfSize);
    }
}

geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

const material = new THREE.LineBasicMaterial({ color: CONFIG.colorLineas });
const linesMesh = new THREE.LineSegments(geometry, material);
scene.add(linesMesh);

// ==========================================
// ANIMACIÓN Y EVENTOS
// ==========================================

function animate() {
    requestAnimationFrame(animate);

    // Rotación suave de todo el conjunto de líneas
    linesMesh.rotation.x += CONFIG.velocidadRotacionX;
    linesMesh.rotation.y += CONFIG.velocidadRotacionY;

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
