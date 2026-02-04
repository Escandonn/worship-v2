document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.modern-form');

  // Si el formulario no existe en esta página, salimos para evitar errores
  if (!form) return;

  // Crear contenedor para la tarjeta de confirmación
  const confirmationCard = document.createElement('div');
  confirmationCard.id = 'confirmation-card';
  confirmationCard.innerHTML = `
    <div class="confirmation-content">
      <div class="checkmark">✓</div>
      <h3>¡Éxito!</h3>
      <p>Tus datos fueron recibidos exitosamente</p>
      <div class="info-details">
        <span id="confirm-nombre"></span>
        <span id="confirm-email"></span>
      </div>
      <button class="close-confirmation">Cerrar</button>
    </div>
  `;
  
  // Agregar estilos a la tarjeta
  const style = document.createElement('style');
  style.textContent = `
    #confirmation-card {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.3s ease-in-out;
    }

    #confirmation-card.show {
      display: flex;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .confirmation-content {
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      border: 2px solid #00ff88;
      border-radius: 20px;
      padding: 3rem;
      text-align: center;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 0 30px rgba(0, 255, 136, 0.3), 0 20px 60px rgba(0, 0, 0, 0.5);
      animation: slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes slideUp {
      from {
        transform: translateY(50px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .checkmark {
      width: 80px;
      height: 80px;
      margin: 0 auto 1.5rem;
      background: #00ff88;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 3rem;
      color: #000;
      font-weight: bold;
      animation: scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s backwards;
    }

    @keyframes scaleIn {
      from {
        transform: scale(0);
      }
      to {
        transform: scale(1);
      }
    }

    .confirmation-content h3 {
      color: #00ff88;
      font-size: 2rem;
      margin-bottom: 0.5rem;
      font-family: Arial, sans-serif;
    }

    .confirmation-content p {
      color: #ccc;
      font-size: 1.1rem;
      margin-bottom: 1.5rem;
      font-family: Arial, sans-serif;
    }

    .info-details {
      background: rgba(0, 255, 136, 0.1);
      border-left: 3px solid #00ff88;
      padding: 1rem;
      margin-bottom: 1.5rem;
      text-align: left;
      border-radius: 8px;
    }

    .info-details span {
      display: block;
      color: #fff;
      margin: 0.5rem 0;
      font-size: 0.95rem;
      font-family: Arial, sans-serif;
    }

    .close-confirmation {
      background: linear-gradient(135deg, #00ff88 0%, #00cc6f 100%);
      color: #000;
      border: none;
      padding: 0.8rem 2.5rem;
      font-size: 1rem;
      border-radius: 10px;
      cursor: pointer;
      font-weight: bold;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(0, 255, 136, 0.3);
    }

    .close-confirmation:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 255, 136, 0.5);
    }

    .close-confirmation:active {
      transform: translateY(0);
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(confirmationCard);

  const closeBtn = confirmationCard.querySelector('.close-confirmation');
  closeBtn.addEventListener('click', () => {
    confirmationCard.classList.remove('show');
    form.reset();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const apellido = document.getElementById('apellido').value.trim();
    const email = document.getElementById('email').value.trim();
    const numero = document.getElementById('numero').value.trim();

    try {
      const response = await fetch('/api/mensajes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, apellido, email, numero })
      });

      const data = await response.json();

      if (response.ok) {
        // Mostrar tarjeta de confirmación
        document.getElementById('confirm-nombre').textContent = `Nombre: ${nombre} ${apellido}`;
        document.getElementById('confirm-email').textContent = `Correo: ${email}`;
        confirmationCard.classList.add('show');
        form.reset();
      } else {
        alert(data.error || 'Error al enviar los datos');
      }
    } catch (err) {
      alert('Error de conexión');
      console.error(err);
    }
  });
});
