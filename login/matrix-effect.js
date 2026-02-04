// ===== EFECTO MATRIX EN CANVAS =====
function initMatrixEffect() {
    const canvas = document.getElementById('matrixCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Ajustar tamaño del canvas
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const characters = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    const fontSize = 16;
    const columns = canvas.width / fontSize;
    const drops = Array(Math.floor(columns)).fill(1);

    function drawMatrix() {
        // Fondo semi-transparente
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#00ff00';
        ctx.font = fontSize + 'px "Courier New"';

        for (let i = 0; i < drops.length; i++) {
            const char = characters.charAt(Math.floor(Math.random() * characters.length));
            const x = i * fontSize;
            const y = drops[i] * fontSize;

            // Efecto de desvanecimiento
            ctx.globalAlpha = Math.random() * 0.5 + 0.5;
            ctx.fillText(char, x, y);

            // Reset alpha
            ctx.globalAlpha = 1;

            // Reiniciar si cae del canvas
            if (y > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }

    // Animar efecto matrix
    const matrixInterval = setInterval(drawMatrix, 50);

    // Parar cuando se enfoca en login
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            clearInterval(matrixInterval);
        }
    });
}

// Iniciar cuando se carga el DOM
document.addEventListener('DOMContentLoaded', initMatrixEffect);
