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
    frases: ["Bienvenido a worship", "SOMOS EL SIGUIENTE NIVEL EN PAGINAS WEB"],
    colorMain: 0x2266ff,       // Azul (App.js)
    colorBorder: 0xffffff,     // Blanco (App.js)
    typingSpeed: 100,
    
    // Escala para adaptar la lógica de app.js (Radio 40) al mundo de version1 (Z 800)
    textScale: 70,             

    // Tiempos y Distancias
    duracionZoom: 2000,        // 2 segundos exactos de zoom
    distanciaZoom: 400,       // Distancia a recorrer (sincronizada con el espacio)
    
    tamanoEspacio: 1000, 
    divisiones: 16, 
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

let loadedFont = null;
let activeTextGroup = null;
let activeCharGroups = [];
let currentPhraseIndex = 0;

// Estados de la animación
let currentState = 'LOADING'; // LOADING, SETUP, TYPING, WAITING, FADING, ZOOMING
let stateStartTime = 0;
let lastTypeTime = 0;
let typeIndex = 0;
let zoomStartZ = 0;

// Materiales globales (Transparentes para permitir Fade Out)
const mainMat = new THREE.MeshPhongMaterial({ 
    color: CONFIG.colorMain, 
    shininess: 100,
    transparent: true,
    opacity: 1
});
const borderMat = new THREE.MeshBasicMaterial({ 
    color: CONFIG.colorBorder,
    transparent: true,
    opacity: 1
});

// Función para crear el texto dinámicamente
function createTextPhrase(textString) {
    if (activeTextGroup) {
        sceneText.remove(activeTextGroup);
    }

    activeTextGroup = new THREE.Group();
    activeCharGroups = [];
    sceneText.add(activeTextGroup);

    // 1. Lógica de división de líneas para textos largos
    let lines = [];
    if (textString.length > 20) {
        const words = textString.split(' ');
        const mid = Math.ceil(words.length / 2);
        lines.push(words.slice(0, mid).join(' '));
        lines.push(words.slice(mid).join(' '));
    } else {
        lines.push(textString);
    }

    const radius = 40 * CONFIG.textScale;
    const anglePerChar = 0.035; // Espaciado fijo por letra para evitar solapamiento

    // Centrado vertical del bloque de texto
    const lineHeight = 1.2 * CONFIG.textScale;
    const totalHeightOffset = (lines.length - 1) * lineHeight / 2;

    lines.forEach((lineStr, lineIndex) => {
        // Arco dinámico: crece según la cantidad de letras
        const totalArc = Math.max(0.3, lineStr.length * anglePerChar);
        const lineY = (lineIndex * -lineHeight) + totalHeightOffset;

        for (let i = 0; i < lineStr.length; i++) {
            const char = lineStr[i];
            if (char === " ") {
                activeCharGroups.push(null);
                continue;
            }

            const letterContainer = new THREE.Group();

            // Geometría Principal
            const mainGeo = new TextGeometry(char, {
                font: loadedFont,
                size: 0.8 * CONFIG.textScale,
                height: 0.2 * CONFIG.textScale,
                bevelEnabled: true,
                bevelThickness: 0.02 * CONFIG.textScale,
                bevelSize: 0.02 * CONFIG.textScale
            });
            mainGeo.center();
            const mainMesh = new THREE.Mesh(mainGeo, mainMat);

            // Geometría Borde
            const borderGeo = new TextGeometry(char, {
                font: loadedFont,
                size: 0.85 * CONFIG.textScale,
                height: 0.1 * CONFIG.textScale,
                bevelEnabled: true,
                bevelThickness: 0.05 * CONFIG.textScale,
                bevelSize: 0.05 * CONFIG.textScale
            });
            borderGeo.center();
            const borderMesh = new THREE.Mesh(borderGeo, borderMat);
            borderMesh.position.z = -0.15 * CONFIG.textScale;

            letterContainer.add(borderMesh);
            letterContainer.add(mainMesh);

            // Posición Curva
            let angle = 0;
            if (lineStr.length > 1) {
                angle = (i / (lineStr.length - 1) - 0.5) * totalArc;
            }

            letterContainer.position.x = Math.sin(angle) * radius;
            letterContainer.position.y = (Math.cos(angle) * radius) - radius + lineY;
            letterContainer.rotation.z = -angle;

            letterContainer.visible = false;
            activeTextGroup.add(letterContainer);
            activeCharGroups.push(letterContainer);
        }
    });
}

const loader = new FontLoader();
loader.load('https://unpkg.com/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json', (font) => {
    loadedFont = font;
    currentState = 'SETUP';
});

// ==========================================
// ANIMACIÓN
// ==========================================

function animate() {
    requestAnimationFrame(animate);
    const now = Date.now();

    linesMesh.rotation.x += CONFIG.velocidadRotacionX;
    linesMesh.rotation.y += CONFIG.velocidadRotacionY;

    // --- MÁQUINA DE ESTADOS ---
    if (currentState === 'SETUP') {
        mainMat.opacity = 1;
        borderMat.opacity = 1;
        createTextPhrase(CONFIG.frases[currentPhraseIndex]);
        
        // FIX: Anclar el texto a la cámara para mantener el tamaño constante
        if (activeTextGroup) {
            activeTextGroup.position.z = camera.position.z - 800;
        }

        handleResize(); // Ajustar tamaño/posición
        
        currentState = 'TYPING';
        typeIndex = 0;
        lastTypeTime = now;
    }
    else if (currentState === 'TYPING') {
        if (now - lastTypeTime > CONFIG.typingSpeed) {
            if (typeIndex < activeCharGroups.length) {
                if (activeCharGroups[typeIndex]) activeCharGroups[typeIndex].visible = true;
                typeIndex++;
                lastTypeTime = now;
            } else {
                currentState = 'WAITING';
                stateStartTime = now;
            }
        }
    }
    else if (currentState === 'WAITING') {
        // Solo procedemos al zoom si NO es la última frase
        if (currentPhraseIndex < CONFIG.frases.length - 1) {
            if (now - stateStartTime > 2000) { 
                currentState = 'FADING';
                stateStartTime = now;
            }
        }
    }
    else if (currentState === 'FADING') {
        const progress = (now - stateStartTime) / 1000; // 1 segundo para desaparecer
        if (progress >= 1) {
            mainMat.opacity = 0;
            borderMat.opacity = 0;
            if (activeTextGroup) activeTextGroup.visible = false;
            
            currentState = 'ZOOMING';
            stateStartTime = now;
            zoomStartZ = camera.position.z;
        } else {
            mainMat.opacity = 1 - progress;
            borderMat.opacity = 1 - progress;
        }
    }
    else if (currentState === 'ZOOMING') {
        const progress = (now - stateStartTime) / CONFIG.duracionZoom;
        
        if (progress >= 1) {
            // Fin del zoom
            camera.position.z = zoomStartZ - CONFIG.distanciaZoom;
            linesMesh.position.z = camera.position.z - (camera.position.z % CONFIG.tamanoEspacio);
            
            // Siguiente frase
            currentPhraseIndex++;
            currentState = 'SETUP';
        } else {
            // Movimiento
            const currentZ = zoomStartZ - (CONFIG.distanciaZoom * progress);
            camera.position.z = currentZ;
            
            // Efecto Fractal: La matriz sigue a la cámara en bucle
            linesMesh.position.z = camera.position.z - (camera.position.z % CONFIG.tamanoEspacio);
        }
    }

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
        if(activeTextGroup) activeTextGroup.scale.set(0.35, 0.35, 0.35); // Escala más segura para textos largos
        if(activeTextGroup) activeTextGroup.position.y = 60;             // Ajuste vertical para compensar las 2 líneas
    } else {
        if(activeTextGroup) activeTextGroup.scale.set(1, 1, 1);
        if(activeTextGroup) activeTextGroup.position.y = 100;
    }
}

window.addEventListener('resize', handleResize);
handleResize(); // Ejecutar al inicio para asegurar el centrado
animate();