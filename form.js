window.addEventListener('load', () => {
  const form = document.querySelector('.modern-form');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const apellido = document.getElementById('apellido').value.trim();
    const email = document.getElementById('email').value.trim();
    const numero = document.getElementById('numero').value.trim();

    try {
      const res = await fetch('/api/mensajes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, apellido, email, numero })
      });

      const data = await res.json();

      if (res.ok) {
        alert('Datos enviados');
        form.reset();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    }
  });
});
