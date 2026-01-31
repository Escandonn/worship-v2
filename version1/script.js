import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

// ==========================================
// CONFIGURACIÓN (Variables optimizadas)
// ==========================================
const CONFIG = {
    colorFondo: 0x000000,
    colorLineas: 0xffffff,
    
    // Configuración del Texto
    textoContenido: "Bienvenido a worship",
    colorMain: 0x2266ff,       // Azul (App.js)
    colorBorder: 0xffffff,     // Blanco (App.js)
    typingSpeed: 100,
    
    // Escala para adaptar la lógica de app.js (Radio 40) al mundo de version1 (Z 800)
    textScale: 70,             
    
    tamanoEspacio: 1000, 
    divisiones: 12, 
    velocidadRotacionX: 0.001,
    velocidadRotacionY: 0.0015,
    campoDeVision: 75
};

// ==========================================
// INICIALIZACIÓN
// ==========================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(CONFIG.colorFondo);

// Escena para el texto (Renderizado superior)
const sceneText = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    CONFIG.campoDeVision, 
    window.innerWidth / window.innerHeight, 
    1, 
    3000
);
camera.position.z = 800;

// Iluminación para resaltar el volumen del texto
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
sceneText.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 10, 2000);
pointLight.position.set(0, 100, 500);
sceneText.add(pointLight);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.autoClear = false; 

document.body.appendChild(renderer.domElement);

// ==========================================
// MATRIZ DE LÍNEAS
// ==========================================

const geometry = new THREE.BufferGeometry();
const positions = [];
const step = CONFIG.tamanoEspacio / CONFIG.divisiones;
const halfSize = CONFIG.tamanoEspacio / 2;

for (let i = 0; i <= CONFIG.divisiones; i++) {
    const u = -halfSize + i * step;
    for (let j = 0; j <= CONFIG.divisiones; j++) {
        const v = -halfSize + j * step;
        positions.push(-halfSize, u, v, halfSize, u, v);
        positions.push(u, -halfSize, v, u, halfSize, v);
        positions.push(u, v, -halfSize, u, v, halfSize);
    }
}

geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
const materialLines = new THREE.LineBasicMaterial({ 
    color: CONFIG.colorLineas,
    transparent: true,
    opacity: 0.4 // Líneas un poco más tenues para resaltar el texto
});
const linesMesh = new THREE.LineSegments(geometry, materialLines);
scene.add(linesMesh);

// ==========================================
// LÓGICA DE TEXTO (SOBRESALIENTE)
// ==========================================

const textGroup = new THREE.Group();
sceneText.add(textGroup);

const charGroups = []; // Grupos de letras (Borde + Relleno)

const loader = new FontLoader();
loader.load('https://unpkg.com/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json', (font) => {
    
    // Parámetros de la lógica original (app.js) escalados
    const textString = CONFIG.textoContenido;
    const radius = 40 * CONFIG.textScale;  // Radio masivo para la curva
    const totalArc = 0.5;                  // Apertura del arco
    
    for (let i = 0; i < textString.length; i++) {
        const char = textString[i];
        if (char === " ") {
            charGroups.push(null);
            continue;
        }

        // 1. Grupo para la letra individual
        const letterContainer = new THREE.Group();

        // 2. Geometría Principal (Azul) - Lógica app.js escalada
        const mainGeo = new TextGeometry(char, {
            font: font,
            size: 0.8 * CONFIG.textScale,
            height: 0.2 * CONFIG.textScale,
            bevelEnabled: true,
            bevelThickness: 0.02 * CONFIG.textScale,
            bevelSize: 0.02 * CONFIG.textScale
        });
        mainGeo.center();
        const mainMat = new THREE.MeshPhongMaterial({ color: CONFIG.colorMain, shininess: 100 });
        const mainMesh = new THREE.Mesh(mainGeo, mainMat);

        // 3. Geometría del Borde (Blanca) - Lógica app.js escalada
        const borderGeo = new TextGeometry(char, {
            font: font,
            size: 0.85 * CONFIG.textScale,
            height: 0.1 * CONFIG.textScale,
            bevelEnabled: true,
            bevelThickness: 0.05 * CONFIG.textScale,
            bevelSize: 0.05 * CONFIG.textScale
        });
        borderGeo.center();
        const borderMat = new THREE.MeshBasicMaterial({ color: CONFIG.colorBorder });
        const borderMesh = new THREE.Mesh(borderGeo, borderMat);
        borderMesh.position.z = -0.15 * CONFIG.textScale; // Detrás

        letterContainer.add(borderMesh);
        letterContainer.add(mainMesh);

        // --- CÁLCULO DE POSICIÓN CURVA (Lógica app.js) ---
        const angle = (i / (textString.length - 1) - 0.5) * totalArc;
        letterContainer.position.x = Math.sin(angle) * radius;
        letterContainer.position.y = (Math.cos(angle) * radius) - radius;
        letterContainer.rotation.z = -angle;

        letterContainer.visible = false;
        textGroup.add(letterContainer);
        charGroups.push(letterContainer);
    }

    // Iniciar animación tipo máquina de escribir
    startTypewriter(0);
});

function startTypewriter(index) {
    if (index < charGroups.length) {
        if (charGroups[index]) {
            charGroups[index].visible = true;
        }
        setTimeout(() => startTypewriter(index + 1), CONFIG.typingSpeed);
    }
}

// ==========================================
// ANIMACIÓN
// ==========================================

function animate() {
    requestAnimationFrame(animate);

    linesMesh.rotation.x += CONFIG.velocidadRotacionX;
    linesMesh.rotation.y += CONFIG.velocidadRotacionY;

    renderer.clear();
    renderer.render(scene, camera);     // Renderiza primero el fondo/líneas
    renderer.clearDepth();              // Limpia la profundidad para que el texto no se oculte
    renderer.render(sceneText, camera); // Renderiza el texto encima
}

function handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    
    // Lógica responsive mejorada para evitar que el texto se salga
    if (width < 600) {
        textGroup.scale.set(0.45, 0.45, 0.45); // Escala reducida para móviles
        textGroup.position.y = 50;             // Altura ajustada para móvil
    } else {
        textGroup.scale.set(1, 1, 1);
        textGroup.position.y = 100;            // Altura original para desktop
    }
}

window.addEventListener('resize', handleResize);
handleResize(); // Ejecutar al inicio para asegurar el centrado
animate();