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

    // --- INYECCIÓN DE OVERLAY CSS (HUD) ---
    const overlay = document.createElement('div');
    overlay.className = 'sec3-overlay';
    overlay.innerHTML = `
        <div class="sec3-hud-top">
            <span class="hud-text">SYSTEM::CORE_V2</span>
            <div class="hud-line"></div>
            <span class="hud-text">STATUS::ONLINE</span>
        </div>
        <div class="sec3-hud-bottom">
            <span class="hud-text">DATA_STREAM_SYNC</span>
            <div class="hud-line"></div>
            <span class="hud-text">/// WORSHIP.ENTERPRISE</span>
        </div>
    `;
    container.appendChild(overlay);

    // --- BOTÓN DE PAUSA (SYSTEM HALT) ---
    let isPaused = false;
    const pauseBtn = document.createElement('div');
    Object.assign(pauseBtn.style, {
        position: 'absolute',
        bottom: '40px',
        right: '40px',
        width: '50px',
        height: '50px',
        border: '1px solid rgba(0, 255, 255, 0.3)',
        borderRadius: '50%',
        background: 'rgba(0, 0, 0, 0.5)',
        color: 'rgba(0, 255, 255, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: '100',
        fontSize: '10px',
        fontFamily: 'Courier New, monospace',
        letterSpacing: '1px',
        backdropFilter: 'blur(4px)',
        transition: 'all 0.3s ease',
        boxShadow: '0 0 10px rgba(0, 255, 255, 0.1)'
    });
    pauseBtn.innerHTML = 'STOP';

    pauseBtn.addEventListener('click', () => {
        isPaused = !isPaused;
        if (isPaused) {
            pauseBtn.innerHTML = 'RUN';
            pauseBtn.style.borderColor = '#ff3333';
            pauseBtn.style.color = '#ff3333';
            pauseBtn.style.boxShadow = '0 0 20px rgba(255, 50, 50, 0.4)';
        } else {
            pauseBtn.innerHTML = 'STOP';
            pauseBtn.style.borderColor = 'rgba(0, 255, 255, 0.3)';
            pauseBtn.style.color = 'rgba(0, 255, 255, 0.7)';
            pauseBtn.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.1)';
        }
    });
    container.appendChild(pauseBtn);

    // --- BOTÓN DE VELOCIDAD (SPEED BOOST) ---
    let isFast = false;
    const speedBtn = document.createElement('div');
    Object.assign(speedBtn.style, {
        position: 'absolute',
        bottom: '40px',
        right: '100px', // A la izquierda del botón de pausa
        width: '50px',
        height: '50px',
        border: '1px solid rgba(0, 255, 255, 0.3)',
        borderRadius: '50%',
        background: 'rgba(0, 0, 0, 0.5)',
        color: 'rgba(0, 255, 255, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: '100',
        fontSize: '10px',
        fontFamily: 'Courier New, monospace',
        letterSpacing: '1px',
        backdropFilter: 'blur(4px)',
        transition: 'all 0.3s ease',
        boxShadow: '0 0 10px rgba(0, 255, 255, 0.1)'
    });
    speedBtn.innerHTML = '1X';

    speedBtn.addEventListener('click', () => {
        isFast = !isFast;
        if (isFast) {
            speedBtn.innerHTML = '4X';
            speedBtn.style.borderColor = '#ffff00';
            speedBtn.style.color = '#ffff00';
            speedBtn.style.boxShadow = '0 0 20px rgba(255, 255, 0, 0.4)';
        } else {
            speedBtn.innerHTML = '1X';
            speedBtn.style.borderColor = 'rgba(0, 255, 255, 0.3)';
            speedBtn.style.color = 'rgba(0, 255, 255, 0.7)';
            speedBtn.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.1)';
        }
    });
    container.appendChild(speedBtn);

    // 4. Iluminación para resaltar los colores brillantes
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 2, 150);
    pointLight.position.set(0, 30, 0);
    scene.add(pointLight);

    // Post-processing (Bloom)
    const renderScene = new RenderPass(scene, camera);
    
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.8, 0.5, 0.85);
    bloomPass.threshold = 0.05;
    bloomPass.strength = 2.5;
    bloomPass.radius = 0.8;

    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    // 5. Crear los Carruseles (Un Anillo)
    const ringLeft = new THREE.Group();
    const ringInner = new THREE.Group(); // Contenedor interno para separar el giro de la orientación
    ringLeft.add(ringInner);
    scene.add(ringLeft);

    // --- Luz tipo linterna desde el anillo ---
    // Color Cyan, Intensidad alta, Distancia limitada para atenuación (más lejos más tenue)
    const ringLight = new THREE.SpotLight(0x00ffff, 30, 70, 0.6, 0.5, 1.5);
    ringLight.position.set(0, 0, 0);
    
    const lightTarget = new THREE.Object3D();
    lightTarget.position.set(0, 20, 0); // Apunta hacia afuera (eje Y local)
    ringLeft.add(lightTarget);
    ringLight.target = lightTarget;
    ringLeft.add(ringLight);

    const itemCount = 70; // Aumentado para más líneas
    const radius = 12; // Radio de los anillos
    // Paleta de colores opacos en escala de grises
    const colors = [0x333333, 0x555555, 0x777777, 0x999999, 0xbbbbbb, 0xdddddd];
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 1);

    // Material compartido para todas las instancias
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x888888,
        emissive: 0x555555,
        emissiveIntensity: 2,
        roughness: 0.6,
        metalness: 0.4
    });

    function populateRing(group) {
        // Usar InstancedMesh para mejor rendimiento
        const instancedMesh = new THREE.InstancedMesh(geometry, material, itemCount);
        
        const dummy = new THREE.Object3D();
        const color = new THREE.Color();

        for (let i = 0; i < itemCount; i++) {
            const colorVal = colors[i % colors.length];
            color.setHex(colorVal);

            const length = 5 + Math.random() * 10;
            dummy.scale.z = length;

            const angle = (i / itemCount) * Math.PI * 2;
            const r = radius + (Math.random() - 0.5) * 3;
            
            dummy.position.x = Math.cos(angle) * r;
            dummy.position.z = Math.sin(angle) * r;
            dummy.rotation.y = -angle;

            dummy.updateMatrix();
            instancedMesh.setMatrixAt(i, dummy.matrix);
            instancedMesh.setColorAt(i, color);
        }

        instancedMesh.instanceColor.needsUpdate = true;
        group.add(instancedMesh);
    }

    populateRing(ringInner); // Llenar el anillo interno en lugar del contenedor principal

    // 6. Textos Cayendo (Frases Contextuales)
    const fallingTexts = [];
    const phrases = [
        { title: "ARQUITECTURA DE SOFTWARE", desc: "Diseño de sistemas distribuidos de alto rendimiento y tolerancia a fallos." },
        { title: "SOLUCIONES CLOUD-NATIVE", desc: "Infraestructura elástica y orquestación automatizada con Kubernetes." },
        { title: "OPTIMIZACION RENDIMIENTO", desc: "Aceleración de carga y eficiencia computacional para experiencia fluida." },
        { title: "CONSULTORIA ESTRATEGICA", desc: "Análisis profundo para la transformación digital de tu modelo de negocio." },
        { title: "WORSHIP ENTERPRISE", desc: "Ecosistemas digitales corporativos con seguridad de grado militar." },
        { title: "DISENO DE EXPERIENCIA", desc: "Interfaces inmersivas que fusionan estética y funcionalidad intuitiva." },
        { title: "TRANSFORMACION DIGITAL", desc: "Digitalización integral de procesos operativos y canales de venta." },
        { title: "CODIGO ESCALABLE", desc: "Desarrollo modular preparado para el crecimiento exponencial del futuro." },
        { title: "ANALISIS DE DATOS", desc: "Inteligencia de negocios basada en métricas y comportamiento de usuario." },
        { title: "SEO TECNICO AVANZADO", desc: "Posicionamiento orgánico mediante optimización semántica y técnica." }
    ];

    // Helper: Eliminar acentos y la letra 'ñ'
    function removeAccentsAndN(str) {
        return str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/ñ/g, "n")
            .replace(/Ñ/g, "N");
    }

    const processedPhrases = phrases.map(p => ({
        title: removeAccentsAndN(p.title),
        desc: removeAccentsAndN(p.desc).toUpperCase()
    }));
    const spacing = 60; // Aumentado para asegurar que solo pase una frase a la vez

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

            const data = processedPhrases[i]; // Objeto con title y desc
            const phraseGroup = new THREE.Group();

            // 1. Geometría del Título
            const titleGeo = new TextGeometry(data.title, {
                font: font, size: 1.3, height: 0.1, curveSegments: 6,
                bevelEnabled: false
            });
            titleGeo.center();

            // 2. Geometría de la Descripción (Párrafo)
            const descGeo = new TextGeometry(data.desc, {
                font: font, size: 0.6, height: 0.05, curveSegments: 4,
                bevelEnabled: false
            });
            descGeo.center();

            const directions = ['top', 'bottom', 'left', 'right'];           
            const dir = directions[i % 4];

            const textColor = (dir === 'top' || dir === 'bottom') ? 0xffffff : 0x00ffff;
            const textMat = new THREE.MeshStandardMaterial({
                color: textColor, emissive: textColor, emissiveIntensity: 0.5,
                roughness: 0.4, metalness: 0.8
            });

            const titleMesh = new THREE.Mesh(titleGeo, textMat);
            titleMesh.position.y = 0.8; // Posicionar arriba

            const descMesh = new THREE.Mesh(descGeo, textMat);
            descMesh.position.y = -0.8; // Posicionar abajo

            // Calcular ancho de tarjeta basado en el texto más ancho
            titleGeo.computeBoundingBox();
            descGeo.computeBoundingBox();
            const tW = titleGeo.boundingBox.max.x - titleGeo.boundingBox.min.x;
            const dW = descGeo.boundingBox.max.x - descGeo.boundingBox.min.x;
            const maxW = Math.max(tW, dW);

            const cardWidth = maxW + 4; // Padding lateral
            const cardHeight = 4.5;
            const cardGeo = new THREE.PlaneGeometry(cardWidth, cardHeight);

            // La tarjeta también cambia de color para mayor coherencia visual
            const cardColor = (dir === 'top' || dir === 'bottom') ? 0x0a0a0a : 0x001111;
            const cardMat = new THREE.MeshStandardMaterial({
                color: cardColor,
                transparent: true,
                opacity: 0.85,
                side: THREE.DoubleSide,
                roughness: 0.3,
                metalness: 0.8,
                emissive: cardColor,
                emissiveIntensity: 0.2
            });
            const cardMesh = new THREE.Mesh(cardGeo, cardMat);
            cardMesh.position.z = -0.5;

            phraseGroup.add(titleMesh);
            phraseGroup.add(descMesh);
            phraseGroup.add(cardMesh);
            
            // OPTIMIZACIÓN: Orientar hacia la cámara solo una vez, ya que la cámara es estática.
            // Esto ahorra muchos cálculos en el bucle de animación.
            phraseGroup.lookAt(camera.position);

            const baseSpeed = 0.04; // Velocidad reducida para mayor control
            phraseGroup.userData = { 
                index: i,
                baseSpeed: baseSpeed, // Guardar velocidad base
                speed: baseSpeed, // Velocidad actual
                direction: dir // Guardar la dirección: 'top', 'bottom', 'left', 'right'
            };

            const initialOffset = 40 + (i * spacing); // Posición inicial secuencial
            
            if (dir === 'top') phraseGroup.position.set(0, initialOffset, 0);
            else if (dir === 'bottom') phraseGroup.position.set(0, -initialOffset, 0);
            else if (dir === 'left') phraseGroup.position.set(-initialOffset, 0, 0);
            else if (dir === 'right') phraseGroup.position.set(initialOffset, 0, 0);

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
        
        if (isMobile) {
            ringLeft.scale.set(0.7, 0.7, 0.7); // Reducir tamaño solo en móvil
        } else {
            ringLeft.scale.set(1, 1, 1); // Tamaño original en PC
        }

        fallingTexts.forEach(group => {
            if (isMobile) {
                group.scale.set(0.65, 0.65, 0.65); // Letras más grandes en móvil
                // Acelerar en móvil
                if (group.userData.baseSpeed) group.userData.speed = group.userData.baseSpeed * 1.5; // Ajuste de velocidad móvil
            } else {
                group.scale.set(0.8, 0.8, 0.8);       // Letras más pequeñas en PC
                // Velocidad normal en PC
                if (group.userData.baseSpeed) group.userData.speed = group.userData.baseSpeed * 1.5; // Ajuste de velocidad PC
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
        
        if (isPaused) {
            composer.render();
            return;
        }

        const time = Date.now();

        // Girar anillo (Animación interna constante)
        ringInner.rotation.y -= 0.2; // Más rápido
        
        // VARIABLES DE DISTANCIA: Ajusta estos valores según necesites
        const ringDistH = isMobile ? 9 : 22; // Horizontal (Lateral)
        const ringDistV = isMobile ? 15 : 15; // Vertical (Arriba/Abajo) - Más alejado en móvil

        // Variables para determinar dónde deben estar los anillos
        let closestDist = Infinity;
        let activeDir = 'top'; // Dirección por defecto

        // Animar Textos
        fallingTexts.forEach(group => {
            const dir = group.userData.direction;
            const speed = group.userData.speed * (isFast ? 4 : 1);

            // Mover según dirección
            if (dir === 'top') group.position.y -= speed;
            else if (dir === 'bottom') group.position.y += speed;
            else if (dir === 'left') group.position.x += speed;
            else if (dir === 'right') group.position.x -= speed;

            const titleMesh = group.children[0];
            const descMesh = group.children[1];
            const cardMesh = group.children[2];

            // Calcular distancia al centro para determinar frase activa
            const distanceToCenter = group.position.length();

            // Calcular posición objetivo del anillo para esta frase
            let phraseTargetPos = new THREE.Vector3();
            if (dir === 'top') phraseTargetPos.set(0, -ringDistV, 0);
            else if (dir === 'bottom') phraseTargetPos.set(0, ringDistV, 0);
            else if (dir === 'left') phraseTargetPos.set(ringDistH, 0, 0);
            else if (dir === 'right') phraseTargetPos.set(-ringDistH, 0, 0);

            // NUEVA LÓGICA: Desvanecer cuando el ÚLTIMO caracter toca el anillo
            // 1. Calcular vector hacia el anillo
            const toRing = new THREE.Vector3().subVectors(phraseTargetPos, group.position);
            
            // 2. Determinar dirección de movimiento
            let moveDir = new THREE.Vector3();
            if (dir === 'top') moveDir.set(0, -1, 0);
            else if (dir === 'bottom') moveDir.set(0, 1, 0);
            else if (dir === 'left') moveDir.set(1, 0, 0);
            else if (dir === 'right') moveDir.set(-1, 0, 0);

            // 3. Verificar si nos acercamos o alejamos (Dot Product)
            const isApproaching = toRing.dot(moveDir) >= 0;
            const distToRing = toRing.length();
            const halfWidth = cardMesh.geometry.parameters.width / 2;

            if (isApproaching) {
                // Acercándose: Visible
                titleMesh.material.opacity = 1;
                descMesh.material.opacity = 1;
                cardMesh.material.opacity = 0.8;
                titleMesh.material.emissiveIntensity = 0.5;
                descMesh.material.emissiveIntensity = 0.5;
                titleMesh.material.transparent = false;
                descMesh.material.transparent = false;
            } else {
                // Alejándose (Pasando por el anillo): Desvanecer hasta que salga el último caracter
                const fadeProgress = Math.min(1, distToRing / halfWidth);
                const opacity = 1 - fadeProgress;

                titleMesh.material.transparent = true;
                descMesh.material.transparent = true;
                titleMesh.material.opacity = opacity;
                descMesh.material.opacity = opacity;
                cardMesh.material.opacity = opacity * 0.8; // La tarjeta se desvanece con el texto
                
                // Flash de luz antes de desaparecer
                const flash = 0.5 + fadeProgress * 2;
                titleMesh.material.emissiveIntensity = flash;
                descMesh.material.emissiveIntensity = flash;
            }

            // Detectar cuál es la frase "activa" (la más cercana al centro) para posicionar los anillos
            if (distanceToCenter < closestDist) {
                closestDist = distanceToCenter;
                activeDir = dir;
            }

            // Reset al salir de los límites (aprox 40 unidades)
            const limit = 50;
            const totalCycleDist = phrases.length * spacing;

            // Reiniciar al final de la cola para mantener el ciclo infinito
            if (dir === 'top' && group.position.y < -limit) group.position.y += totalCycleDist;
            if (dir === 'bottom' && group.position.y > limit) group.position.y -= totalCycleDist;
            if (dir === 'left' && group.position.x > limit) group.position.x -= totalCycleDist;
            if (dir === 'right' && group.position.x < -limit) group.position.x += totalCycleDist;
        });

        // --- LÓGICA DINÁMICA DE ANILLOS ---
        // El anillo se mueve a la posición de destino según la frase activa
        const targetPos = new THREE.Vector3();
        let targetRotZ = 0;

        if (activeDir === 'top') {
            // Frase viene de arriba -> Anillo abajo
            targetPos.set(0, -ringDistV, 0);
            targetRotZ = 0; // Acostado
        } else if (activeDir === 'bottom') {
            // Frase viene de abajo -> Anillo arriba
            targetPos.set(0, ringDistV, 0);
            targetRotZ = 0; // Acostado
        } else if (activeDir === 'left') {
            // Frase viene de izquierda -> Anillo derecha
            targetPos.set(ringDistH, 0, 0);
            targetRotZ = Math.PI / 2; // De pie (90 grados)
        } else if (activeDir === 'right') {
            // Frase viene de derecha -> Anillo izquierda
            targetPos.set(-ringDistH, 0, 0);
            targetRotZ = Math.PI / 2; // De pie (90 grados)
        }

        // Aplicar movimiento suave (Lerp) a ambos anillos
        const lerpFactor = 0.05;
        const ring = ringLeft;
        
        ring.position.lerp(targetPos, lerpFactor);
        // Rotación Z para orientación (Acostado vs De pie)
        ring.rotation.z += (targetRotZ - ring.rotation.z) * lerpFactor;
        // Limpiar rotación X residual de la animación anterior
        ring.rotation.x = THREE.MathUtils.lerp(ring.rotation.x, 0, lerpFactor);

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