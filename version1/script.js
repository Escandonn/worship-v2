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
    frases: ["Bienvenido a worship", "EL SIGUIENTE NIVEL EN PAGINAS WEB"],
    colorMain: 0x2266ff,       // Azul (App.js)
    colorBorder: 0xffffff,     // Blanco (App.js)
    typingSpeed: 100,
    
    // Escala para adaptar la lógica de app.js (Radio 40) al mundo de version1 (Z 800)
    textScale: 70,             

    // Tiempos y Distancias
    duracionZoom: 2000,        // 2 segundos exactos de zoom
    distanciaZoom: 400,       // Distancia a recorrer (sincronizada con el espacio)
    
    // Configuración Triángulo
    triangleScale: 90,         // Más grande en PC (antes 50)
    triangleOffsetX: 0,        // CENTRADO (Eje de la composición)
    duracionTriangulo: 5000,   // Transición más lenta (5 segundos)
    
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

// Variables para el triángulo
let triangleGroup = null;
let triangleMesh = null;
let circleMesh = null;
let cardsData = []; // Almacena relación Card DOM <-> Linea 3D
let lastShuffleTime = 0;

// Variables Mobile
let mobileStep = 0;
let lastMobileChange = 0;

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
    const isMobile = window.innerWidth < 600;

    if (isMobile) {
        const words = textString.split(' ');
        if (words.length >= 3) {
            const third = Math.ceil(words.length / 3);
            const twoThirds = Math.ceil((words.length * 2) / 3);
            lines.push(words.slice(0, third).join(' '));
            lines.push(words.slice(third, twoThirds).join(' '));
            lines.push(words.slice(twoThirds).join(' '));
        } else {
            lines.push(textString);
        }
    } else if (textString.length > 20) {
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

// Función para crear el Triángulo y Círculo
function createTriangle() {
    if (triangleGroup) sceneText.remove(triangleGroup);
    
    triangleGroup = new THREE.Group();
    const s = CONFIG.triangleScale;

    // 1. Triángulo (TubeGeometry)
    const points = [
        new THREE.Vector3(0, 1.5 * s, 0),
        new THREE.Vector3(1.5 * s, -1 * s, 0),
        new THREE.Vector3(-1.5 * s, -1 * s, 0),
        new THREE.Vector3(0, 1.5 * s, 0)
    ];
    const path = new THREE.CatmullRomCurve3(points);
    const tubeGeo = new THREE.TubeGeometry(path, 64, 0.15 * s, 8, false);
    const tubeMat = new THREE.MeshStandardMaterial({ 
        color: 0xff00ff, // Magenta Neón
        emissive: 0xff00ff,
        emissiveIntensity: 2
    });
    triangleMesh = new THREE.Mesh(tubeGeo, tubeMat);
    triangleGroup.add(triangleMesh);

    // 2. Círculo (TorusGeometry)
    const torusGeo = new THREE.TorusGeometry(2.5 * s, 0.05 * s, 16, 100);
    const torusMat = new THREE.MeshStandardMaterial({ 
        color: 0x00ffff, // Cian Neón
        emissive: 0x00ffff,
        emissiveIntensity: 2,
        transparent: true,
        opacity: 0 // Oculto al inicio
    });
    circleMesh = new THREE.Mesh(torusGeo, torusMat);
    triangleGroup.add(circleMesh);

    sceneText.add(triangleGroup);
}

// Función para crear conectores (Líneas)
function createConnectors() {
    cardsData = [];

    // Definición de las 6 Cards con sus colores únicos
    // El orden coincide con el DOM: 4, 5, 6, 1, 2, 3
    const cardConfigs = [
        { id: 'card-4', color: 0x9d00ff }, // Desarrollo (Purple)
        { id: 'card-5', color: 0xff8800 }, // Marketing (Orange)
        { id: 'card-6', color: 0xffff00 }, // Soporte (Yellow)
        { id: 'card-1', color: 0x00d4ff }, // Innovación (Cyan)
        { id: 'card-2', color: 0xff0055 }, // Diseño (Pink)
        { id: 'card-3', color: 0x00ff88 }  // Estrategia (Green)
    ];

    const domCards = document.querySelectorAll('.info-card');

    cardConfigs.forEach((config, i) => {
        // Guardamos la referencia
        cardsData.push({
            domElement: domCards[i],
            targetSlot: i // Inicialmente asignados en orden 0-5
        });
    });
}

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
        } else {
            // ES LA ÚLTIMA FRASE: Esperar 3 segundos y luego caer
            if (now - stateStartTime > 1500) {
                currentState = 'DROPPING';
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
    else if (currentState === 'DROPPING') {
        // Efecto de caída al vacío
        if (activeTextGroup) {
            activeTextGroup.position.y -= 15; // Velocidad de caída
            activeTextGroup.rotation.x += 0.02; // Rotación dramática al caer
            
            // Si ya bajó lo suficiente (desapareció de pantalla)
            if (activeTextGroup.position.y < -1000) {
                sceneText.remove(activeTextGroup);
                currentState = 'SHOW_NAV';
                
                // Mostrar Navbar
                const nav = document.querySelector('nav');
                nav.style.opacity = '1';
                nav.style.pointerEvents = 'auto';

                // Iniciar animación del triángulo
                createTriangle();
                currentState = 'ANIMATE_TRIANGLE';
                stateStartTime = now;
            }
        }
    }
    else if (currentState === 'ANIMATE_TRIANGLE') {
        const progress = Math.min((now - stateStartTime) / CONFIG.duracionTriangulo, 1);
        
        // Posición relativa a la cámara (misma profundidad que el texto)
        const zPos = camera.position.z - 800;
        const startX = -1500; // Entra desde la izquierda fuera de pantalla
        const endX = CONFIG.triangleOffsetX;
        
        if (triangleGroup) {
            triangleGroup.position.z = zPos;
            
            // Movimiento suave (Ease out)
            const ease = 1 - Math.pow(1 - progress, 3);
            triangleGroup.position.x = startX + (endX - startX) * ease;
            
            // Rotación de entrada y continua
            triangleMesh.rotation.x = ease * Math.PI * 2;
            triangleMesh.rotation.y += 0.01;

            // Aparición del círculo al final
            if (progress > 0.8) {
                if (circleMesh.material.opacity < 1) circleMesh.material.opacity += 0.02;
                const pulse = 1 + Math.sin(now * 0.005) * 0.05;
                circleMesh.scale.set(pulse, pulse, pulse);
            }
        }

        if (progress >= 1) {
            currentState = 'WAITING_INTERACTION';
            stateStartTime = now;
        }
    }
    else if (currentState === 'WAITING_INTERACTION') {
        // Pausa estratégica de 2 segundos
        if (now - stateStartTime > 2000) {
            currentState = 'SHOW_CARDS';
            stateStartTime = now;
            createConnectors();
            
            // Inicializar lógica Mobile si es necesario
            if (window.innerWidth < 800) {
                lastMobileChange = now - 3000; // Forzar cambio inmediato (ajustado a 3s)
            }
        }
    }
    else if (currentState === 'SHOW_CARDS') {
        const isMobile = window.innerWidth < 800;

        if (!isMobile) {
            // --- LÓGICA DESKTOP ---
            
            // Definición de los 6 Slots (Posiciones 3D y Clases CSS)
            const slots = [
                { x: -400, y: 150, css: 'slot-0' }, // Izq Arriba
                { x: -400, y: 0,   css: 'slot-1' }, // Izq Centro
                { x: -400, y: -150, css: 'slot-2' }, // Izq Abajo
                { x: 400, y: 150, css: 'slot-3' }, // Der Arriba
                { x: 400, y: 0,   css: 'slot-4' }, // Der Centro
                { x: 400, y: -150, css: 'slot-5' }  // Der Abajo
            ];

            // Cambio de posición cada 5 segundos
            if (now - lastShuffleTime > 5000) {
                // Mezclar solo verticalmente (Izquierda con Izquierda, Derecha con Derecha)
                const leftIndices = [0, 1, 2];
                for (let i = leftIndices.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [leftIndices[i], leftIndices[j]] = [leftIndices[j], leftIndices[i]];
                }

                const rightIndices = [3, 4, 5];
                for (let i = rightIndices.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [rightIndices[i], rightIndices[j]] = [rightIndices[j], rightIndices[i]];
                }
                
                const indices = [...leftIndices, ...rightIndices];

                // Asignar nuevos slots a las cards
                cardsData.forEach((card, i) => {
                    // Remover clases de slot anteriores
                    slots.forEach(s => card.domElement.classList.remove(s.css));
                    
                    // Asignar nuevo slot
                    const newSlotIndex = indices[i];
                    card.targetSlot = newSlotIndex;
                    card.domElement.classList.add(slots[newSlotIndex].css);
                });

                lastShuffleTime = now;
            }
            
            // Animar cada card/linea hacia su slot actual
            cardsData.forEach((card) => {
                // Mostrar card
                if (!card.domElement.classList.contains('visible')) {
                    card.domElement.classList.add('visible');
                }
            });

            // Mostrar Chatbot después de 2 segundos de mostrar las cards
            const chatbot = document.getElementById('chatbot-container');
            if (chatbot && !chatbot.classList.contains('visible') && (now - stateStartTime > 2000)) {
                chatbot.classList.add('visible');
            }
        } else {
            // --- LÓGICA MOBILE (Carrusel 3s) ---
            if (now - lastMobileChange > 3000) {
                const cards = document.querySelectorAll('.info-card');
                
                // Ocultar todas
                cards.forEach(c => c.classList.remove('visible'));
                
                // Mostrar actual
                const currentCard = cards[mobileStep % cards.length]; // Ciclo 0, 1, 2...
                if (currentCard) currentCard.classList.add('visible');

                // Mover Triángulo según la card
                // Card 1 (idx 0): Triángulo baja (Y negativo)
                // Card 2 (idx 1): Triángulo sube (Y positivo)
                // Card 3 (idx 2): Triángulo centro
                let targetY = 0;
                if (mobileStep % 3 === 0) targetY = -150; // Card 1 arriba, Triángulo baja
                else if (mobileStep % 3 === 1) targetY = 150;  // Card 2 abajo, Triángulo sube
                else targetY = 0;

                // Guardar objetivo en userData para animarlo suave
                if (triangleGroup) triangleGroup.userData.targetY = targetY;

                mobileStep++;
                lastMobileChange = now;
            }

            // Animación suave del triángulo (Lerp)
            if (triangleGroup && triangleGroup.userData.targetY !== undefined) {
                triangleGroup.position.y += (triangleGroup.userData.targetY - triangleGroup.position.y) * 0.05;
            }

            // Mostrar Chatbot en móvil también
            const chatbot = document.getElementById('chatbot-container');
            if (chatbot && !chatbot.classList.contains('visible') && (now - stateStartTime > 2000)) {
                chatbot.classList.add('visible');
            }
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
        if(activeTextGroup) activeTextGroup.scale.set(0.40, 0.40, 0.40); // Un poco más anchas
        if(activeTextGroup) activeTextGroup.position.y = 70;             // Ajuste vertical para compensar las 3 líneas
        CONFIG.triangleOffsetX = 0; // Centrado en móvil
        if(triangleGroup) triangleGroup.scale.set(0.4, 0.4, 0.4); // Reducir triángulo en móvil
    } else {
        if(activeTextGroup) activeTextGroup.scale.set(1, 1, 1);
        if(activeTextGroup) activeTextGroup.position.y = 100;
        CONFIG.triangleOffsetX = 0; // CENTRADO en desktop (Eje central)
        if(triangleGroup) triangleGroup.scale.set(1, 1, 1); // Tamaño completo en PC
    }
}

window.addEventListener('resize', handleResize);
handleResize(); // Ejecutar al inicio para asegurar el centrado
animate();

// ==========================================
// LÓGICA CHATBOT (Expandir/Contraer)
// ==========================================
const chatbotContainer = document.getElementById('chatbot-container');
const chatbotHeader = document.getElementById('chatbot-header');
const chatHistoryEl = document.getElementById('chat-history');
const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send-btn');

// Configuración del Chatbot (API Key hardcoded para prototipo frontend)
const CHAT_CONFIG = {
    apiKey: (() => {
        try {
            return import.meta.env.VITE_GROQ_API_KEY;
        } catch (e) {
            return "";
        }
    })(),
    model: "llama-3.1-8b-instant",
    systemPrompt: "Eres un asistente virtual que asesora sobre páginas web, tu función es atender dudas profesionalmente."
};

// Estado del historial (Cargar de sessionStorage o iniciar)
let conversationHistory = JSON.parse(sessionStorage.getItem('chatHistory')) || [
    { role: "system", content: CHAT_CONFIG.systemPrompt }
];

// Función para renderizar mensaje en UI
function appendMessageToUI(role, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${role}`;
    msgDiv.textContent = text;
    chatHistoryEl.appendChild(msgDiv);
    chatHistoryEl.scrollTop = chatHistoryEl.scrollHeight; // Auto-scroll
}

// Cargar mensajes previos al iniciar (si existen)
if (conversationHistory.length > 1) {
    conversationHistory.forEach(msg => {
        if (msg.role !== 'system') {
            appendMessageToUI(msg.role, msg.content);
        }
    });
} else {
    // Mensaje de bienvenida por defecto
    appendMessageToUI('assistant', '¡Hola! Soy Risp. ¿En qué puedo ayudarte con tu proyecto web hoy?');
}

// Función principal para enviar mensaje
async function handleSendMessage() {
    const userText = chatInput.value.trim();
    if (!userText) return;

    // 1. Mostrar mensaje usuario
    appendMessageToUI('user', userText);
    chatInput.value = '';

    // 2. Actualizar historial
    conversationHistory.push({ role: "user", content: userText });

    // Validación de API Key antes de llamar
    if (!CHAT_CONFIG.apiKey) {
        appendMessageToUI('assistant', '⚠️ Error: API Key no detectada. Asegúrate de tener el archivo .env y reinicia el servidor (npm run dev).');
        return;
    }

    // 3. Limitar ventana de contexto (Regla de Oro: últimos 10 mensajes + system)
    if (conversationHistory.length > 11) {
        // Mantenemos el system prompt (índice 0) y los últimos 10
        const lastMessages = conversationHistory.slice(-10);
        conversationHistory = [conversationHistory[0], ...lastMessages];
    }

    // 4. Llamada a la API
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CHAT_CONFIG.apiKey}`
            },
            body: JSON.stringify({
                model: CHAT_CONFIG.model,
                messages: conversationHistory
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error?.message || `Error ${response.status}: ${data.error?.code || 'Desconocido'}`);
        }

        if (data.choices && data.choices.length > 0) {
            const botReply = data.choices[0].message.content;
            
            // 5. Mostrar respuesta y guardar
            appendMessageToUI('assistant', botReply);
            conversationHistory.push({ role: "assistant", content: botReply });
            
            // Persistencia
            sessionStorage.setItem('chatHistory', JSON.stringify(conversationHistory));
        }
    } catch (error) {
        console.error('Error API:', error);
        appendMessageToUI('assistant', `Error del sistema: ${error.message}`);
    }
}

if (chatbotHeader && chatbotContainer) {
    chatbotHeader.addEventListener('click', () => {
        chatbotContainer.classList.toggle('expanded');
    });

    // Event Listeners para el chat
    chatSendBtn.addEventListener('click', handleSendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSendMessage();
    });
}