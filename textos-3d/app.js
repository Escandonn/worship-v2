import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

// --- CONFIGURACIÓN DE ESCENA ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Iluminación frontal y ambiental
const light = new THREE.DirectionalLight(0xffffff, 2.5);
light.position.set(0, 5, 15);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

camera.position.z = 12;

const loader = new FontLoader();
const group = new THREE.Group();
scene.add(group);

// --- PARÁMETROS DEL ARCO (Estilo Imagen 1) ---
const textString = "EFECTO TYPEWRITER";
const radius = 40;               // Radio masivo para curva plana
const totalArc = 0.4;            // Apertura muy pequeña
const typingSpeed = 100;
const charGroups = [];           // Guardaremos grupos (letra + borde)

loader.load('https://unpkg.com/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json', (font) => {
    
    for (let i = 0; i < textString.length; i++) {
        const char = textString[i];
        if (char === " ") {
            charGroups.push(null);
            continue;
        }

        // 1. Grupo para la letra individual (Contiene letra azul + borde blanco)
        const letterContainer = new THREE.Group();

        // 2. Geometría de la Letra Principal (Azul)
        const mainGeo = new TextGeometry(char, {
            font: font,
            size: 0.8,
            height: 0.2,
            bevelEnabled: true,
            bevelThickness: 0.02,
            bevelSize: 0.02
        });
        mainGeo.center();
        const mainMat = new THREE.MeshPhongMaterial({ color: 0x2266ff, shininess: 100 });
        const mainMesh = new THREE.Mesh(mainGeo, mainMat);

        // 3. Geometría del Borde (Blanca - ligeramente más grande)
        const borderGeo = new TextGeometry(char, {
            font: font,
            size: 0.85,          // Un poco más grande
            height: 0.1,         // Menos profundidad
            bevelEnabled: true,
            bevelThickness: 0.05,
            bevelSize: 0.05      // El grosor del borde
        });
        borderGeo.center();
        const borderMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const borderMesh = new THREE.Mesh(borderGeo, borderMat);
        borderMesh.position.z = -0.15; // Se coloca justo detrás

        letterContainer.add(borderMesh);
        letterContainer.add(mainMesh);

        // --- CÁLCULO DE POSICIÓN ---
        const angle = (i / (textString.length - 1) - 0.5) * totalArc;
        letterContainer.position.x = Math.sin(angle) * radius;
        letterContainer.position.y = (Math.cos(angle) * radius) - radius;
        letterContainer.rotation.z = -angle;

        letterContainer.visible = false;
        group.add(letterContainer);
        charGroups.push(letterContainer);
    }

    group.position.y = 1; // Ajuste de altura central
    startTypewriter(0);
});

function startTypewriter(index) {
    if (index < charGroups.length) {
        if (charGroups[index]) {
            charGroups[index].visible = true;
        }
        setTimeout(() => startTypewriter(index + 1), typingSpeed);
    }
}

// --- FUNCIÓN RESPONSIVE ---
function handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    
    // Ajustar zoom de cámara según el ancho de pantalla
    if (width < 600) {
        camera.position.z = 18; // Alejamos la cámara en móviles
        group.scale.set(0.7, 0.7, 0.7); // Escalamos el texto
    } else {
        camera.position.z = 12;
        group.scale.set(1, 1, 1);
    }

    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

window.addEventListener('resize', handleResize);
handleResize(); // Ejecutar al inicio

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();