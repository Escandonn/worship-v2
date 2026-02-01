import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

document.addEventListener('DOMContentLoaded', () => {
    const stripTop = document.getElementById('matrix-top');
    const stripBottom = document.getElementById('matrix-bottom');

    if (stripTop && stripBottom) {
        // Cargar fuente una vez y luego iniciar las escenas
        const loader = new FontLoader();
        loader.load('https://unpkg.com/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json', (font) => {
            initMatrixStrip(stripTop, font, 'down');
            initMatrixStrip(stripBottom, font, 'up'); // Opcional: efecto invertido o igual
        });
    }
});

function initMatrixStrip(container, font, direction = 'down') {
    // 1. Escena
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    // Niebla verde para profundidad
    scene.fog = new THREE.FogExp2(0x000000, 0.02);

    // 2. Cámara
    const width = container.clientWidth;
    const height = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.z = 30;
    camera.position.y = 0; // Centrar cámara para simetría arriba/abajo

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // 4. Geometrías Base (0 y 1) para clonar
    const mat0 = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.8 });
    const mat1 = new THREE.MeshBasicMaterial({ color: 0x88ff88, transparent: true, opacity: 0.8 }); // Un poco más brillante

    const geo0 = new TextGeometry('0', { font: font, size: 2, height: 0.5 });
    const geo1 = new TextGeometry('1', { font: font, size: 2, height: 0.5 });
    
    // Centrar geometrías
    geo0.center();
    geo1.center();

    // Calcular límites visibles para cubrir todo el ancho
    const vFOV = THREE.MathUtils.degToRad(camera.fov);
    const visibleHeight = 2 * Math.tan(vFOV / 2) * camera.position.z;
    let visibleWidth = visibleHeight * camera.aspect;

    // 5. Crear Columnas de Binarios
    const columns = [];
    // AUMENTAR DENSIDAD: "Caer demasiado" -> Más columnas y más juntas
    const colCount = Math.floor(visibleWidth * 1.5); 

    for (let i = 0; i < colCount; i++) {
        const x = (Math.random() - 0.5) * visibleWidth; // Esparcir en todo el ancho visible
        const z = (Math.random() - 0.5) * 15; // Profundidad Z
        const speed = 0.2 + Math.random() * 0.5; // Más rápidos
        
        // Cada columna tiene un "carácter" cayendo
        const isOne = Math.random() > 0.5;
        const mesh = new THREE.Mesh(isOne ? geo1 : geo0, isOne ? mat1 : mat0);
        
        // Posición inicial aleatoria en Y para llenar la pantalla desde el inicio
        const startY = (Math.random() - 0.5) * visibleHeight * 1.5;
        mesh.position.set(x, startY, z);
        
        mesh.rotation.y = Math.random() * Math.PI; // Rotación inicial aleatoria
        
        scene.add(mesh);
        columns.push({ mesh, speed, rotSpeed: (Math.random() - 0.5) * 0.05 });
    }

    // 6. Animación
    const animate = () => {
        requestAnimationFrame(animate);

        columns.forEach(col => {
            // Lógica de Dirección (Arriba / Abajo)
            if (direction === 'down') {
                col.mesh.position.y -= col.speed;
                // Reiniciar al salir por abajo
                if (col.mesh.position.y < -visibleHeight / 2 - 5) {
                    col.mesh.position.y = visibleHeight / 2 + 5;
                    col.mesh.position.x = (Math.random() - 0.5) * visibleWidth;
                }
            } else {
                // Subir
                col.mesh.position.y += col.speed;
                // Reiniciar al salir por arriba
                if (col.mesh.position.y > visibleHeight / 2 + 5) {
                    col.mesh.position.y = -visibleHeight / 2 - 5;
                    col.mesh.position.x = (Math.random() - 0.5) * visibleWidth;
                }
            }
            
            // Rotación 3D
            col.mesh.rotation.y += col.rotSpeed;
            col.mesh.rotation.x += col.rotSpeed * 0.5;
        });

        renderer.render(scene, camera);
    };
    animate();

    // 7. Responsive
    let lastWidth = container.clientWidth;

    const resizeObserver = new ResizeObserver(() => {
        const newW = container.clientWidth;
        const newH = container.clientHeight;

        // Evitar saltos en móvil si solo cambia la altura (barra de dirección)
        if (window.innerWidth < 768 && newW === lastWidth) return;
        lastWidth = newW;

        renderer.setSize(newW, newH);
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        // Actualizar ancho visible para los respawns
        visibleWidth = (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * camera.position.z) * camera.aspect;
    });
    resizeObserver.observe(container);
}