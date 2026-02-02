import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

document.addEventListener('DOMContentLoaded', () => {
    // Buscamos el contenedor principal de la sección 3
    const container = document.getElementById('section-3');

    if (container) {
        initCarousel(container);
    }
});

function initCarousel(container) {
    // 1. Escena
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505); // Fondo muy oscuro
    scene.fog = new THREE.FogExp2(0x050505, 0.02); // Niebla para profundidad

    // 2. Cámara
    const width = container.clientWidth;
    const height = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    
    // Posición elevada para ver la "rueda acostada"
    camera.position.set(0, 25, 40);
    camera.lookAt(0, 0, 0);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // 4. Iluminación para resaltar los colores brillantes
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    pointLight.position.set(0, 20, 0);
    scene.add(pointLight);

    // Post-processing (Bloom)
    const renderScene = new RenderPass(scene, camera);
    
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0; // Brillar todo lo que tenga luz
    bloomPass.strength = 2.0; // Intensidad del láser
    bloomPass.radius = 0.5;   // Dispersión del brillo

    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    // 5. Crear los Carruseles (Dos Ruedas)
    const ringLeft = new THREE.Group();
    const ringRight = new THREE.Group();
    scene.add(ringLeft);
    scene.add(ringRight);

    const itemCount = 60; 
    const radius = 12;
    const colors = [0xff0055, 0x00ffaa, 0x5500ff, 0xffff00, 0x00ffff, 0xff00ff];
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 1); 

    function populateRing(group) {
        for (let i = 0; i < itemCount; i++) {
            const color = colors[i % colors.length];
            const material = new THREE.MeshStandardMaterial({ 
                color: color,
                emissive: color,
                emissiveIntensity: 2.5,
                roughness: 0.1,
                metalness: 0.5
            });

            const mesh = new THREE.Mesh(geometry, material);
            const length = 5 + Math.random() * 10;
            mesh.scale.z = length;

            const angle = (i / itemCount) * Math.PI * 2;
            const r = radius + (Math.random() - 0.5) * 3;
            
            mesh.position.x = Math.cos(angle) * r;
            mesh.position.z = Math.sin(angle) * r;
            mesh.rotation.y = -angle; 

            group.add(mesh);
        }
    }

    populateRing(ringLeft);
    populateRing(ringRight);

    // 6. Textos Cayendo (Frases Contextuales)
    const fallingTexts = [];
    const phrases = [
        "DESARROLLO WEB", "INNOVACION 3D", "EXPERIENCIA DIGITAL", "FUTURO INMERSIVO", "WORSHIP V2",
        "ESTRATEGIA UI/UX", "ESTRATEGIA DIGITAL", "CODIGO LIMPIO", "PERFORMANCE", "SEO AVANZADO",
        "ANIMACIONES WEB", "INTERACTIVIDAD", "ARQUITECTURA WEB", "SOPORTE 24/7", "CREATIVIDAD",
        "TECNOLOGIA", "VANGUARDIA", "IMPACTO VISUAL", "CONVERSIÓN", "IDENTIDAD DE MARCA"
    ];

    const spacing = 35; // Espaciado vertical amplio para que caigan una a una

    const loader = new FontLoader();
    loader.load('https://unpkg.com/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json', (font) => {
        phrases.forEach((text, i) => {
            const textGeo = new TextGeometry(text, {
                font: font,
                size: 2.0, // Tamaño base ajustado
                height: 0.2,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 0.03,
                bevelSize: 0.02,
                bevelOffset: 0,
                bevelSegments: 5
            });
            textGeo.center();

            const textMat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: 0xffffff,
                emissiveIntensity: 0.5,
                roughness: 0.4,
                metalness: 0.8
            });

            const textMesh = new THREE.Mesh(textGeo, textMat);
            
            // Guardar índice y velocidad aleatoria en userData
            textMesh.userData = { 
                index: i,
                speed: 0.08 // Velocidad constante y más lenta
            };

            // Posición inicial Y escalonada
            textMesh.position.y = 25 + (i * spacing); 
            textMesh.position.z = 0;
            
            scene.add(textMesh);
            fallingTexts.push(textMesh);
        });
        
        // Aplicar layout inicial una vez cargada la fuente
        updateLayout();
    });

    // Función para manejar el layout responsive (1 columna móvil vs 3 columnas PC)
    function updateLayout() {
        const width = container.clientWidth;
        const isMobile = width < 768;
        
        // Configuración de Anillos
        if (isMobile) {
            ringLeft.position.set(0, 0, 0);
            ringRight.visible = false;
        } else {
            ringLeft.position.set(-15, 0, 0); // Más centrados (antes 25)
            ringRight.position.set(15, 0, 0); // Más centrados (antes 25)
            ringRight.visible = true;
        }

        fallingTexts.forEach(mesh => {
            if (isMobile) {
                mesh.scale.set(0.6, 0.6, 0.6); // Letras más pequeñas en móvil
                mesh.position.x = 0;           // Una sola columna central
            } else {
                mesh.scale.set(1, 1, 1);       // Tamaño normal en PC
                // 2 Columnas alternadas: Izquierda (-15) y Derecha (15)
                const isRight = mesh.userData.index % 2 !== 0;
                mesh.position.x = isRight ? 15 : -15;
            }
        });
    }

    // 7. Animación
    const animate = () => {
        requestAnimationFrame(animate);
        
        const time = Date.now();

        // Girar ambos anillos (Direcciones opuestas)
        ringLeft.rotation.y -= 0.15;
        ringRight.rotation.y += 0.15;
        
        // Oscilación suave
        ringLeft.rotation.z = Math.sin(time * 0.002) * 0.15;
        ringLeft.rotation.x = Math.cos(time * 0.001) * 0.1;

        ringRight.rotation.z = Math.sin(time * 0.002 + 1) * 0.15;
        ringRight.rotation.x = Math.cos(time * 0.001 + 1) * 0.1;

        // Animar Textos
        fallingTexts.forEach(mesh => {
            mesh.position.y -= mesh.userData.speed; // Bajando lento

            // Efecto de desaparecer al llegar al círculo (y=0)
            if (mesh.position.y < 10) {
                // Fade out (Transparencia progresiva hasta 0)
                const opacity = Math.max(0, mesh.position.y / 10);
                mesh.material.transparent = true;
                mesh.material.opacity = opacity;
                
                // Flash de luz antes de desaparecer
                mesh.material.emissiveIntensity = 0.5 + (1 - opacity) * 3;
            } else {
                mesh.material.opacity = 1;
                mesh.material.emissiveIntensity = 0.5;
            }

            // Reset inmediato al tocar el centro (y=0)
            if (mesh.position.y <= 0) {
                // Reiniciar arriba manteniendo el espaciado exacto
                mesh.position.y = phrases.length * spacing; 
            }
            
            // Orientar hacia la cámara para legibilidad perfecta
            mesh.lookAt(camera.position);
        });

        composer.render();
    };
    animate();

    // 7. Responsive (Ajuste de tamaño)
    const resizeObserver = new ResizeObserver(() => {
        const newW = container.clientWidth;
        const newH = container.clientHeight;

        renderer.setSize(newW, newH);
        composer.setSize(newW, newH);
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        updateLayout(); // Actualizar posiciones de columnas al redimensionar
    });
    resizeObserver.observe(container);
}