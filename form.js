const form = document.querySelector('.modern-form');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nombre = document.getElementById('nombre').value.trim();
  const apellido = document.getElementById('apellido').value.trim();
  const email = document.getElementById('email').value.trim();
  const numero = document.getElementById('numero').value.trim();

  if (!nombre || !apellido || !email || !numero) {
    alert('Por favor completa todos los campos');
    return;
  }

  try {
    const response = await fetch('/api/mensajes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ nombre, apellido, email, numero })
    });

    const result = await response.json();

    if (response.ok) {
      alert('Datos enviados correctamente');
      form.reset();
    } else {
      alert('Error: ' + result.error);
    }

  } catch (error) {
    console.error(error);
    alert('Error de conexión con el servidor');
  }
});
