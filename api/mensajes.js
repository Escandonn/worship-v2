document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.modern-form');

  if (!form) return;

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
        alert('Datos enviados correctamente');
        form.reset();
      } else {
        alert(data.error);
      }

    } catch (err) {
      alert('Error de conexión');
      console.error(err);
    }
  });
});
