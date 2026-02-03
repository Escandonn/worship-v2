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
    const particleColors = new Float32Array(particleCount * 3); // NUEVO: Para colores por partícula
    const pMaterial = new THREE.PointsMaterial({
        vertexColors: true,
        size: 1.5, // Aumentamos el tamaño para mayor visibilidad
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthTest: false, // CORRECCIÓN: Asegura que las partículas se vean sobre otros objetos
    });

    // Paleta de colores vibrantes para las chispas
    const sparkColors = [
        new THREE.Color(0xff44ff), // Magenta brillante
        new THREE.Color(0x44ffff), // Cyan brillante
        new THREE.Color(0xffff44), // Amarillo brillante
        new THREE.Color(0xff8800), // Naranja
        new THREE.Color(0x44ff88)  // Verde neón
    ];

    for (let i = 0; i < particleCount; i++) {
        particles.push({
            position: new THREE.Vector3(),
            velocity: new THREE.Vector3(),
            life: 0,
        });
        particlePositions[i * 3 + 1] = 9999; // Posición Y inicial fuera de la vista
        // Color inicial (no importa mucho ya que son invisibles)
        particleColors[i * 3] = 1;
        particleColors[i * 3 + 1] = 1;
        particleColors[i * 3 + 2] = 1;
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3)); // AÑADIR ATRIBUTO DE COLOR
    const particleSystem = new THREE.Points(particleGeometry, pMaterial);
    scene.add(particleSystem);

    let nextParticle = 0;
    function spawnParticles(origin) {
        const count = 40; // Aumentamos la cantidad de partículas por impacto
        for (let i = 0; i < count; i++) {
            const p = particles[nextParticle];
            p.life = 1.0;
            p.position.copy(origin);
            
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.1 + Math.random() * 0.2; // Un poco más de velocidad
            p.velocity.set(Math.cos(angle) * speed, Math.sin(angle) * speed, (Math.random() - 0.5) * 0.1);
            p.velocity.y += 0.1; // Mayor impulso hacia arriba inicial

            // Asignar un color vibrante aleatorio a la partícula
            const sparkColor = sparkColors[Math.floor(Math.random() * sparkColors.length)];
            particleColors[(nextParticle * 3)] = sparkColor.r;
            particleColors[(nextParticle * 3) + 1] = sparkColor.g;
            particleColors[(nextParticle * 3) + 2] = sparkColor.b;

            nextParticle = (nextParticle + 1) % particleCount;
        }
        particleGeometry.attributes.color.needsUpdate = true; // Marcar para actualizar
    }

    // 5. Crear los Carruseles (Dos Ruedas)
    const ringLeft = new THREE.Group();
    const ringRight = new THREE.Group();
    scene.add(ringLeft);
    scene.add(ringRight);

    const itemCount = 60; 
    const radius = 12; // Radio de los anillos
    // Paleta de colores opacos en escala de grises
    const colors = [0x333333, 0x555555, 0x777777, 0x999999, 0xbbbbbb, 0xdddddd];
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 1); 

    /**
     * Elimina acentos y la letra 'ñ' de una cadena de texto.
     * @param {string} str La cadena de texto a procesar.
     * @returns {string} La cadena de texto sin acentos ni 'ñ'.
     */
    function removeAccentsAndN(str) {
        return str
            .normalize("NFD") // Descompone caracteres acentuados en su base y el acento
            .replace(/[\u0300-\u036f]/g, "") // Elimina los caracteres de acento
            .replace(/ñ/g, "n") // Reemplaza 'ñ' por 'n'
            .replace(/Ñ/g, "N"); // Reemplaza 'Ñ' por 'N'
    }

    function populateRing(group) {
        for (let i = 0; i < itemCount; i++) {
            const color = colors[i % colors.length];
            // Material más opaco, menos brillante.
            // Se usa MeshStandardMaterial para que reaccione a la luz y al bloom.
            // El emissive le da un brillo propio que se realza con el bloom.
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
        "ARQUITECTURA DE SOFTWARE", "SOLUCIONES CLOUD-NATIVE", "OPTIMIZACION DE RENDIMIENTO", "CONSULTORIA ESTRATEGICA", "WORSHIP ENTERPRISE", // ó, é
        "DISENO DE EXPERIENCIA (UX)", "TRANSFORMACION DIGITAL", "CODIGO ESCALABLE", "ANALISIS DE DATOS", "SEO TECNICO AVANZADO", // ñ, ó, ó, í
        "INTEGRACION DE API RESTFUL", "SEGURIDAD WEB (OWASP)", "METODOLOGIAS AGILE", "SOPORTE DEDICADO", "INNOVACION DISRUPTIVA", // ó, í, ó
        "INTELIGENCIA ARTIFICIAL", "VISUALIZACION 3D", "BRANDING CORPORATIVO", "OPTIMIZACION DE CONVERSION", "IDENTIDAD DIGITAL"
    ];

    // Aplicar la función a todas las frases
    const processedPhrases = phrases.map(phrase => removeAccentsAndN(phrase));
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

            const text = processedPhrases[i]; // Usar las frases procesadas
            const phraseGroup = new THREE.Group();

            const textGeo = new TextGeometry(text, {
                font: font, size: 2.0, height: 0.2, curveSegments: 12,
                bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.02,
                bevelOffset: 0, bevelSegments: 5
            });
            textGeo.center();

            // Lógica para alternar la dirección y el color
            const isFromTop = i % 2 === 0;
            const textColor = isFromTop ? 0xffffff : 0x00ffff; // Blanco para arriba, Cyan para abajo

            const textMat = new THREE.MeshStandardMaterial({
                color: textColor, emissive: textColor, emissiveIntensity: 0.5,
                roughness: 0.4, metalness: 0.8
            });

            const textMesh = new THREE.Mesh(textGeo, textMat);

            const cardWidth = text.length * 0.9;
            const cardHeight = 3.5;
            const cardGeo = new THREE.PlaneGeometry(cardWidth, cardHeight);

            // La tarjeta también cambia de color para mayor coherencia visual
            const cardColor = isFromTop ? 0x101010 : 0x001010; // Negro para arriba, Cian oscuro para abajo

            const cardMat = new THREE.MeshBasicMaterial({
                color: cardColor, transparent: true, opacity: 0.8, side: THREE.DoubleSide
            });
            const cardMesh = new THREE.Mesh(cardGeo, cardMat);
            cardMesh.position.z = -0.5;

            phraseGroup.add(textMesh);
            phraseGroup.add(cardMesh);
            
            // OPTIMIZACIÓN: Orientar hacia la cámara solo una vez, ya que la cámara es estática.
            // Esto ahorra muchos cálculos en el bucle de animación.
            phraseGroup.lookAt(camera.position);

            // Determinar dirección y posición
            const direction = isFromTop ? -1 : 1; // -1 para bajar, 1 para subir
            const groupIndex = Math.floor(i / 2); // Índice dentro de su grupo (arriba o abajo)

            const baseSpeed = 0.09;
            const speedBonus = text.length > 25 ? 0.09 : 0; // Aumentar ligeramente el bonus para textos largos
            phraseGroup.userData = { 
                index: i,
                baseSpeed: baseSpeed + speedBonus, // Guardar velocidad base
                speed: baseSpeed + speedBonus, // Velocidad actual
                hasSpawned: false,
                direction: direction // Guardar la dirección del movimiento
            };

            // Posición inicial basada en si viene de arriba o abajo
            phraseGroup.position.y = (isFromTop ? 1 : -1) * (25 + (groupIndex * spacing));
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
        const isMobile = width < 1025;
        
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
                // Acelerar en móvil
                if (group.userData.baseSpeed) group.userData.speed = group.userData.baseSpeed * 2.0; // Más rápido en móvil
            } else {
                group.scale.set(0.8, 0.8, 0.8);       // Letras más pequeñas en PC
                // 2 Columnas alternadas: Izquierda (-12) y Derecha (12)
                const isRight = group.userData.index % 2 !== 0;
                group.position.x = isRight ? 12 : -12;
                // Velocidad normal en PC
                if (group.userData.baseSpeed) group.userData.speed = group.userData.baseSpeed;
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

        const isMobile = container.clientWidth < 1025;

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
            // Mover hacia arriba o abajo según la dirección guardada
            group.position.y += group.userData.speed * group.userData.direction;

            const textMesh = group.children[0];
            const cardMesh = group.children[1];

            // Efecto de desaparecer al acercarse al centro (y=0)
            const approachZone = 10;
            const distanceToCenter = Math.abs(group.position.y);

            if (distanceToCenter < approachZone) {
                // Fade out (Transparencia progresiva hasta 0)
                const opacity = Math.max(0, distanceToCenter / approachZone);
                textMesh.material.transparent = true;
                textMesh.material.opacity = opacity;
                cardMesh.material.opacity = opacity * 0.8; // La tarjeta se desvanece con el texto
                
                // Flash de luz antes de desaparecer
                textMesh.material.emissiveIntensity = 0.5 + (1 - opacity) * 3;
            } else {
                textMesh.material.opacity = 1;
                cardMesh.material.opacity = 0.8;
                textMesh.material.emissiveIntensity = 0.5;
                group.userData.hasSpawned = false; // Resetear flag cuando está lejos del centro
            }

            // Reset al cruzar el centro (y=0)
            const isFromTop = group.userData.direction === -1;
            const hasCrossedCenter = (isFromTop && group.position.y <= 0) || (!isFromTop && group.position.y >= 0);

            if (hasCrossedCenter) {
                // Spawn de partículas solo una vez por cruce
                if (!group.userData.hasSpawned) {
                    const spawnPosition = new THREE.Vector3(group.position.x, 0, 0);
                    spawnParticles(spawnPosition); // Genera chispas de colores
                    group.userData.hasSpawned = true;
                }

                // Reiniciar en su propio "carril" (arriba o abajo)
                const totalTopPhrases = Math.ceil(phrases.length / 2);
                const totalBottomPhrases = Math.floor(phrases.length / 2);
                
                if (isFromTop) {
                    // Si venía de arriba, se reinicia al final de la cola de arriba
                    group.position.y = totalTopPhrases * spacing;
                } else {
                    // Si venía de abajo, se reinicia al final de la cola de abajo
                    group.position.y = - (totalBottomPhrases * spacing);
                }
            }
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