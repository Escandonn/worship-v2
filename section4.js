document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('section-4');
    if (container) {
        initMatrixFooter2D(container);
    }
});

function initMatrixFooter2D(container) {
    const canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    let width, height;
    let columns;
    let drops = [];
    let columnState = []; // Estado para saber si una columna está escribiendo una frase
    const fontSize = 14;

    const resize = () => {
        width = container.clientWidth;
        height = container.clientHeight;
        
        // Ajustar resolución interna del canvas
        canvas.width = width;
        canvas.height = height;

        columns = Math.ceil(width / fontSize);
        
        // Reiniciar gotas
        drops = [];
        columnState = [];
        for (let i = 0; i < columns; i++) {
            // Iniciar en posiciones aleatorias para llenar la pantalla inmediatamente
            drops[i] = Math.random() * height; 
            columnState[i] = { phrase: null, charIndex: -1 };
        }
    };

    // Observer para cambios de tamaño
    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(container);
    resize(); // Inicializar

    const chars = "01";
    const phrases = [
        "Y TU YA ESTAS LISTO",
        "WORSHIP V2",
        "DESPIERTA",
        "SISTEMA ONLINE",
        "CONECTANDO...",
        "ACCESO CONCEDIDO",
        "REALIDAD VIRTUAL",
        "CODIGO VERDE"
    ];

    function animate() {
        // Fondo negro semitransparente para efecto estela
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, width, height);

        ctx.font = 'bold ' + fontSize + 'px monospace';

        for (let i = 0; i < drops.length; i++) {
            let text = '';
            let isPhrase = false;

            // Lógica para decidir si escribir frase o binario
            if (columnState[i].phrase) {
                // Estamos escribiendo una frase
                const p = columnState[i].phrase;
                const idx = columnState[i].charIndex;
                text = p.charAt(idx);
                
                columnState[i].charIndex--; // Decrementamos para que se lea de Arriba a Abajo mientras sube
                if (columnState[i].charIndex < 0) {
                    columnState[i].phrase = null; // Fin de la frase
                }
                isPhrase = true;
            } else {
                // Carácter aleatorio
                text = chars.charAt(Math.floor(Math.random() * chars.length));
                
                // Probabilidad baja de iniciar una nueva frase
                if (Math.random() > 0.995) {
                    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
                    columnState[i].phrase = randomPhrase;
                    columnState[i].charIndex = randomPhrase.length - 1; // Empezar por el final para leerse bien
                }
            }

            const x = i * fontSize;
            const y = drops[i];

            // Color: Verde brillante para frases, verde normal para binario
            ctx.fillStyle = isPhrase ? '#ccffcc' : '#00ff00';
            ctx.fillText(text, x, y);

            // Mover hacia ARRIBA
            drops[i] -= fontSize;

            // Reiniciar al fondo si sale por arriba (con aleatoriedad)
            if (drops[i] < 0 && Math.random() > 0.975) {
                drops[i] = height;
                columnState[i].phrase = null; // Resetear frase si se corta
            }
        }
        requestAnimationFrame(animate);
    }
    animate();
}