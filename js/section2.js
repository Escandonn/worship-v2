import * as THREE from 'three';

// Contenido dinámico (3 frases)
const contents = [
    {
        title: "Nuestra Filosofía",
        text: "Creamos experiencias digitales que trascienden lo visual. <br>Fusionamos arte, código y estrategia para definir el futuro de la web."
    },
    {
        title: "Innovación Radical",
        text: "Rompemos los límites de lo posible. <br>Implementamos tecnologías inmersivas y 3D para que tu marca destaque en un océano digital."
    },
    {
        title: "Impacto Global",
        text: "Diseñamos pensando en la escalabilidad. <br>Soluciones robustas que crecen contigo y conectan con audiencias en cualquier parte del mundo."
    }
];

// Configuraciones para el fractal de fondo
const fractalConfigs = [
    { angle: 0.55, depth: 9, hue: 200 },  // Filosofía: Azulado, complejo
    { angle: 0.8, depth: 8, hue: 120 },   // Innovación: Verde, más abierto
    { angle: 0.4, depth: 9, hue: 0 }      // Impacto: Rojo, denso
];

// Parámetros actuales del fractal para animación suave
let fractalParams = {
    angle: fractalConfigs[0].angle,
    depth: fractalConfigs[0].depth,
    hue: fractalConfigs[0].hue
};

let currentIndex = 0;
let arrowLeft, arrowRight;
let isSectionVisible = false; // Bandera para controlar el renderizado

// Objetivos de posición/rotación para animación suave
const targets = {
    left: { pos: new THREE.Vector3(-6, 1.5, 0), rot: new THREE.Euler(0, 0, 0) },
    right: { pos: new THREE.Vector3(6, -1, 0), rot: new THREE.Euler(0, 0, Math.PI) }
};

document.addEventListener('DOMContentLoaded', () => {
    const section2 = document.getElementById('section2');
    const content = document.querySelector('.sec2-content');
    const titleEl = document.querySelector('.sec2-title');
    const textEl = document.querySelector('.sec2-text');

    // Observer para detectar cuando la sección entra en pantalla
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            isSectionVisible = entry.isIntersecting; // Actualizar estado de visibilidad
            if (entry.isIntersecting) {
                content.classList.add('active');
            }
        });
    }, {
        threshold: 0 // Detectar apenas entre/salga de la pantalla
    });

    if (section2) {
        observer.observe(section2);
        initFractalBackground(section2); // NUEVO: Iniciar fondo de fractales
        initArrows(section2); // Iniciar escena 3D de flechas
        
        // Iniciar ciclo de contenido (7 segundos)
        setInterval(() => {
            // 1. Ocultar texto (Fade Out)
            content.classList.remove('active');
            content.style.opacity = '0';
            content.style.transform = 'translateY(20px)';

            setTimeout(() => {
                // 2. Cambiar datos
                currentIndex = (currentIndex + 1) % contents.length;
                
                if (titleEl) titleEl.textContent = contents[currentIndex].title;
                if (textEl) textEl.innerHTML = contents[currentIndex].text;

                // 3. Actualizar flechas y FRACTALES
                updateArrowTargets();
                // La animación del fractal leerá currentIndex y se actualizará sola.

                // 4. Mostrar texto (Fade In)
                content.classList.add('active');
                content.style.opacity = '1';
                content.style.transform = 'translateY(0)';
            }, 1000); // Espera a que termine la transición CSS

        }, 7000);
    }
});

function updateArrowTargets() {
    const isMobile = window.innerWidth < 102;

    if (isMobile) {
        // MÓVIL: Flechas Arriba/Abajo. Cambio Horizontal.
        const yBase = 4.5;
        
        // Rotación: Apuntando hacia el centro (Verticalmente)
        targets.left.rot.z = -Math.PI / 2; // Arriba apunta abajo
        targets.right.rot.z = Math.PI / 2; // Abajo apunta arriba

        // Cambio Horizontal según frase
        let xOffset = 0;
        if (currentIndex === 1) xOffset = -2;
        if (currentIndex === 2) xOffset = 2;

        targets.left.pos.set(xOffset, yBase, 0);
        targets.right.pos.set(-xOffset, -yBase, 0); // Espejo inferior

    } else {
        // PC: Flechas Izq/Der. Cambio Vertical.
        const xBase = 6;
        
        // Rotación: Apuntando hacia el centro (Horizontalmente)
        targets.left.rot.z = 0;
        targets.right.rot.z = Math.PI;

        // Cambio Vertical según frase
        let yLeft = 1.5, yRight = -1;
        if (currentIndex === 1) { yLeft = 0; yRight = 0; }
        if (currentIndex === 2) { yLeft = -1.5; yRight = 1; }

        targets.left.pos.set(-xBase, yLeft, 0);
        targets.right.pos.set(xBase, yRight, 0);
    }
}

function initArrows(container) {
    // 1. Configuración de Escena
    const scene = new THREE.Scene();
    // No establecemos background para que sea transparente
    
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Estilos del canvas para que quede de fondo
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.pointerEvents = 'none'; // Permitir clicks a través
    renderer.domElement.style.zIndex = '0';
    container.appendChild(renderer.domElement);

    // 2. Iluminación
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(5, 5, 10);
    scene.add(dirLight);

    // 3. Crear Flecha (Función Reutilizable)
    const createArrow = () => {
        const group = new THREE.Group();
        
        // Cuerpo (Cilindro)
        const shaftGeo = new THREE.CylinderGeometry(0.1, 0.1, 2.5, 8); // Bajamos segmentos de 32 a 8
        const mat = new THREE.MeshStandardMaterial({ 
            color: 0xcccccc, // Gris metálico claro
            roughness: 0.3, 
            metalness: 0.8 
        });
        const shaft = new THREE.Mesh(shaftGeo, mat);
        shaft.rotation.z = -Math.PI / 2; // Acostada horizontalmente
        group.add(shaft);

        // Punta (Cono)
        const headGeo = new THREE.ConeGeometry(0.35, 0.8, 16); // Bajamos segmentos de 32 a 16
        const head = new THREE.Mesh(headGeo, mat);
        head.rotation.z = -Math.PI / 2;
        head.position.x = 1.6; // En la punta del cilindro
        group.add(head);

        return group;
    };

    arrowLeft = createArrow();
    arrowRight = createArrow();
    
    // Configuración inicial
    updateArrowTargets();
    
    // Posicionar inmediatamente para evitar saltos
    arrowLeft.position.copy(targets.left.pos);
    arrowLeft.rotation.z = targets.left.rot.z;
    arrowRight.position.copy(targets.right.pos);
    arrowRight.rotation.z = targets.right.rot.z;

    scene.add(arrowLeft);
    scene.add(arrowRight);

    // 4. Animación
    const animate = () => {
        requestAnimationFrame(animate);

        if (!isSectionVisible) return; // PAUSAR si no está en pantalla (Ahorra GPU)
        
        const time = Date.now() * 0.002;
        const isMobile = window.innerWidth < 768;
        const lerpSpeed = 0.05;

        // Calcular posición deseada con flotación
        const floatOffset = Math.sin(time) * 0.5;
        
        // Clonar targets para no modificarlos
        const desiredLeft = targets.left.pos.clone();
        const desiredRight = targets.right.pos.clone();

        if (isMobile) {
            // Flotación Vertical en móvil (Señalando arriba/abajo)
            desiredLeft.y += floatOffset * 0.2;
            desiredRight.y -= floatOffset * 0.2;
        } else {
            // Flotación Horizontal en PC (Señalando izq/der)
            desiredLeft.x += floatOffset;
            desiredRight.x -= floatOffset;
        }

        // Lerp Posición
        arrowLeft.position.lerp(desiredLeft, lerpSpeed);
        arrowRight.position.lerp(desiredRight, lerpSpeed);

        // Lerp Rotación (Simple en Z)
        arrowLeft.rotation.z += (targets.left.rot.z - arrowLeft.rotation.z) * lerpSpeed;
        arrowRight.rotation.z += (targets.right.rot.z - arrowRight.rotation.z) * lerpSpeed;
        
        // Cabeceo suave
        arrowLeft.rotation.x = Math.sin(time * 2) * 0.1;
        arrowRight.rotation.x = Math.cos(time * 2) * 0.1;

        renderer.render(scene, camera);
    };
    animate();

    // 5. Responsive
    let lastWidth = container.clientWidth;
    
    const resizeObserver = new ResizeObserver(() => {
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Evitar saltos en móvil si solo cambia la altura (barra de dirección)
        if (window.innerWidth < 768 && width === lastWidth) return;
        lastWidth = width;

        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        updateArrowTargets();
    });
    resizeObserver.observe(container);
}

function initFractalBackground(container) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    container.insertBefore(canvas, container.firstChild); // Insertar al principio para que esté al fondo

    // Estilos del canvas para que quede de fondo
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '0'; // Detrás del contenido pero visible
    canvas.style.pointerEvents = 'none';

    let width, height;

    function resize() {
        width = container.clientWidth;
        height = container.clientHeight;
        canvas.width = width;
        canvas.height = height;
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    function drawBranch(x, y, len, angle, depth) {
        if (depth === 0) return;

        ctx.beginPath();
        ctx.moveTo(x, y);
        const endX = x + len * Math.cos(angle);
        const endY = y + len * Math.sin(angle);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        const newLen = len * 0.75;
        drawBranch(endX, endY, newLen, angle - fractalParams.angle, depth - 1);
        drawBranch(endX, endY, newLen, angle + fractalParams.angle, depth - 1);
    }

    let frameCount = 0;

    function animateFractal() {
        requestAnimationFrame(animateFractal);

        if (!isSectionVisible) return;

        // Lerp de parámetros para suavidad
        const targetConfig = fractalConfigs[currentIndex];
        const lerpFactor = 0.02;
        fractalParams.angle += (targetConfig.angle - fractalParams.angle) * lerpFactor;
        fractalParams.depth += (targetConfig.depth - fractalParams.depth) * lerpFactor;
        
        let hueDiff = targetConfig.hue - fractalParams.hue;
        if (hueDiff > 180) hueDiff -= 360;
        if (hueDiff < -180) hueDiff += 360;
        fractalParams.hue = (fractalParams.hue + hueDiff * lerpFactor + 360) % 360;

        ctx.fillStyle = 'rgba(5, 5, 5, 0.1)';
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = `hsla(${fractalParams.hue}, 100%, 50%, 0.07)`;
        ctx.lineWidth = 0.5;

        const time = frameCount * 0.005;
        drawBranch(width / 2 + Math.cos(time) * (width / 4), height, height / 7, -Math.PI / 2 + Math.sin(time * 0.7) * 0.2, Math.round(fractalParams.depth));
        drawBranch(width / 2 - Math.cos(time * 1.2) * (width / 4), 0, height / 7, Math.PI / 2 - Math.sin(time * 0.8) * 0.2, Math.round(fractalParams.depth));

        frameCount++;
    }

    animateFractal();
}
