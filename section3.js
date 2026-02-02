import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('section-3');
    if (!container) return;

    // Cargar la escena 3D inmediatamente al inicio para una transición fluida.
    initCarousel(container);
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
    
    // SUAVIZADO: El canvas inicia invisible y aparece suavemente cuando está listo
    renderer.domElement.style.opacity = '0';
    renderer.domElement.style.transition = 'opacity 1.5s ease-in-out';
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

    // Particle System for impact effect
    const particleCount = 500;
    const particles = [];
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const pMaterial = new THREE.PointsMaterial({
        color: 0xcccccc, // Color gris/blanco para que combine
        size: 0.5,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthTest: false, // CORRECCIÓN: Asegura que las partículas se vean sobre otros objetos
    });

    for (let i = 0; i < particleCount; i++) {
        particles.push({
            position: new THREE.Vector3(),
            velocity: new THREE.Vector3(),
            life: 0,
        });
        particlePositions[i * 3 + 1] = 9999; // Posición Y inicial fuera de la vista
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleSystem = new THREE.Points(particleGeometry, pMaterial);
    scene.add(particleSystem);

    let nextParticle = 0;
    function spawnParticles(origin) {
        const count = 25; // Cantidad de partículas por impacto
        for (let i = 0; i < count; i++) {
            const p = particles[nextParticle];
            p.life = 1.0;
            p.position.copy(origin);
            
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.05 + Math.random() * 0.15;
            p.velocity.set(Math.cos(angle) * speed, Math.sin(angle) * speed, (Math.random() - 0.5) * 0.1);
            p.velocity.y += 0.05; // Un ligero impulso hacia arriba inicial

            nextParticle = (nextParticle + 1) % particleCount;
        }
    }

    // 5. Crear los Carruseles (Dos Ruedas)
    const ringLeft = new THREE.Group();
    const ringRight = new THREE.Group();
    scene.add(ringLeft);
    scene.add(ringRight);

    const itemCount = 60; 
    const radius = 12;
    // Paleta de colores opacos en escala de grises
    const colors = [0x333333, 0x555555, 0x777777, 0x999999, 0xbbbbbb, 0xdddddd];
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 1); 

    function populateRing(group) {
        for (let i = 0; i < itemCount; i++) {
            const color = colors[i % colors.length];
            // Material más opaco, menos brillante
            const material = new THREE.MeshStandardMaterial({ 
                color: color,
                emissive: 0x111111, // Brillo sutil
                emissiveIntensity: 1,
                roughness: 0.8, // Más rugoso, menos reflejo
                metalness: 0.2
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
        "ARQUITECTURA DE SOFTWARE", "SOLUCIONES CLOUD-NATIVE", "OPTIMIZACION DE RENDIMIENTO", "CONSULTORIA ESTRATEGICA", "WORSHIP ENTERPRISE",
        "DISEÑO DE EXPERIENCIA (UX)", "TRANSFORMACION DIGITAL", "CODIGO ESCALABLE", "ANALISIS DE DATOS", "SEO TECNICO AVANZADO",
        "INTEGRACION DE API RESTFUL", "SEGURIDAD WEB (OWASP)", "METODOLOGIAS AGILE", "SOPORTE DEDICADO", "INNOVACION DISRUPTIVA",
        "INTELIGENCIA ARTIFICIAL", "VISUALIZACION 3D", "BRANDING CORPORATIVO", "OPTIMIZACION DE CONVERSION", "IDENTIDAD DIGITAL"
    ];

    const spacing = 35; // Espaciado vertical amplio para que caigan una a una

    const loader = new FontLoader();
    loader.load('https://unpkg.com/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json', (font) => {
        // OPTIMIZACIÓN: Crear geometrías de texto de forma incremental para no bloquear el hilo principal.
        let i = 0;
        function createPhrasesIncrementally() {
            if (i >= phrases.length) {
                // --- Todas las frases creadas, finalizar la configuración ---
                updateLayout();
                // MOSTRAR ESCENA: Una vez generada la geometría, hacemos fade-in del canvas
                setTimeout(() => {
                    renderer.domElement.style.opacity = '1';
                }, 100);
                return;
            }

            const text = phrases[i];
            const phraseGroup = new THREE.Group();

            const textGeo = new TextGeometry(text, {
                font: font, size: 2.0, height: 0.2, curveSegments: 12,
                bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.02,
                bevelOffset: 0, bevelSegments: 5
            });
            textGeo.center();

            const textMat = new THREE.MeshStandardMaterial({
                color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5,
                roughness: 0.4, metalness: 0.8
            });

            const textMesh = new THREE.Mesh(textGeo, textMat);

            const cardWidth = text.length * 0.9;
            const cardHeight = 3.5;
            const cardGeo = new THREE.PlaneGeometry(cardWidth, cardHeight);
            const cardMat = new THREE.MeshBasicMaterial({
                color: 0x101010, transparent: true, opacity: 0.8, side: THREE.DoubleSide
            });
            const cardMesh = new THREE.Mesh(cardGeo, cardMat);
            cardMesh.position.z = -0.5;

            phraseGroup.add(textMesh);
            phraseGroup.add(cardMesh);
            
            const baseSpeed = 0.06;
            const speedBonus = text.length > 25 ? 0.03 : 0;
            phraseGroup.userData = { 
                index: i,
                speed: baseSpeed + speedBonus,
                hasSpawned: false
            };

            phraseGroup.position.y = 25 + (i * spacing); 
            scene.add(phraseGroup);
            fallingTexts.push(phraseGroup);

            i++;
            // Programar la creación de la siguiente frase en el próximo frame disponible.
            requestAnimationFrame(createPhrasesIncrementally);
        }

        // Iniciar el proceso de creación incremental.
        createPhrasesIncrementally();
    });

    // Función para manejar el layout responsive (1 columna móvil vs 3 columnas PC)
    function updateLayout() {
        const width = container.clientWidth;
        const isMobile = width < 768;
        
        // Configuración de Anillos
        if (isMobile) {
            ringLeft.position.set(0, 0, -10);
            ringRight.visible = false;
        } else {
            ringLeft.position.set(-12, 0, 0); // Más centrados
            ringRight.position.set(12, 0, 0); // Más centrados
            ringRight.visible = true;
        }

        fallingTexts.forEach(group => {
            if (isMobile) {
                group.scale.set(0.4, 0.4, 0.4); // Letras más pequeñas en móvil
                group.position.x = 0;           // Una sola columna central
            } else {
                group.scale.set(0.8, 0.8, 0.8);       // Letras más pequeñas en PC
                // 2 Columnas alternadas: Izquierda (-12) y Derecha (12)
                const isRight = group.userData.index % 2 !== 0;
                group.position.x = isRight ? 12 : -12;
            }
        });
    }

    // CONTROL DE RENDIMIENTO:
    // Aunque cargamos la escena antes, solo animamos cuando el usuario la ve.
    let isVisible = false;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            isVisible = entry.isIntersecting;
        });
    }, { threshold: 0 });
    observer.observe(container);

    // 7. Animación
    const animate = () => {
        requestAnimationFrame(animate);

        if (!isVisible) return; // PAUSA INTELIGENTE: No gastar recursos si no se ve
        
        const time = Date.now();

        // Girar ambos anillos (Direcciones opuestas)
        ringLeft.rotation.y -= 0.15;
        ringRight.rotation.y += 0.15;
        
        // Oscilación suave
        ringLeft.rotation.z = Math.sin(time * 0.002) * 0.15;
        ringLeft.rotation.x = Math.cos(time * 0.001) * 0.1;

        ringRight.rotation.z = Math.sin(time * 0.002 + 1) * 0.15;
        ringRight.rotation.x = Math.cos(time * 0.001 + 1) * 0.1;

        // Animar Partículas
        for (let i = 0; i < particleCount; i++) {
            const p = particles[i];
            if (p.life > 0) {
                p.position.add(p.velocity);
                p.velocity.y -= 0.003; // Gravedad
                p.life -= 0.015;

                if (p.life <= 0) {
                    particlePositions[i * 3 + 1] = 9999; // Mover fuera de la vista
                } else {
                    particlePositions[i * 3] = p.position.x;
                    particlePositions[i * 3 + 1] = p.position.y;
                    particlePositions[i * 3 + 2] = p.position.z;
                }
            }
        }
        particleGeometry.attributes.position.needsUpdate = true;

        // Animar Textos
        fallingTexts.forEach(group => {
            group.position.y -= group.userData.speed; // Bajando con velocidad variable

            const textMesh = group.children[0];
            const cardMesh = group.children[1];

            // Efecto de desaparecer al llegar al círculo (y=0)
            if (group.position.y < 10) {
                // Fade out (Transparencia progresiva hasta 0)
                const opacity = Math.max(0, group.position.y / 10);
                textMesh.material.transparent = true;
                textMesh.material.opacity = opacity;
                cardMesh.material.opacity = opacity * 0.8; // La tarjeta se desvanece con el texto
                
                // Flash de luz antes de desaparecer
                textMesh.material.emissiveIntensity = 0.5 + (1 - opacity) * 3;
            } else {
                textMesh.material.opacity = 1;
                cardMesh.material.opacity = 0.8;
                textMesh.material.emissiveIntensity = 0.5;
                group.userData.hasSpawned = false; // Resetear flag cuando está arriba
            }

            // Reset inmediato al tocar el centro (y=0)
            if (group.position.y <= 0) {
                // Spawn de partículas solo una vez
                if (!group.userData.hasSpawned) {
                    const spawnPosition = new THREE.Vector3(group.position.x, 0, 0);
                    spawnParticles(spawnPosition);
                    group.userData.hasSpawned = true;
                }
                // Reiniciar arriba manteniendo el espaciado exacto
                group.position.y = phrases.length * spacing;
            }
            
            // Orientar hacia la cámara para legibilidad perfecta
            group.lookAt(camera.position);
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