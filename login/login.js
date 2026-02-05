/*
  login.js
  - Conexión a Supabase (cliente UMD cargado dinámicamente)
  - Maneja el formulario #loginForm en login.html
  - Intenta iniciar sesión; si tiene éxito, garantiza que exista una fila en la tabla "users"

  IMPORTANT: Reemplaza SUPABASE_URL y SUPABASE_ANON_KEY con tus credenciales reales.
*/

(function () {
  function show(el, show = true) { if (!el) return; el.style.display = show ? '' : 'none'; }
  function setText(el, txt) { if (!el) return; el.textContent = txt; }

  document.addEventListener('DOMContentLoaded', () => {
    // Si ya hay sesión activa, ir directo al admin
    if (localStorage.getItem('worship_session')) {
      window.location.replace('../admin/admin.html');
      return;
    }

    const form = document.getElementById('loginForm');
    if (!form) return;

    const loadingBar = document.getElementById('loadingBar');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    const loginBtn = document.getElementById('loginBtn');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      show(errorMessage, false);
      show(successMessage, false);

      const email = (document.getElementById('email') || {}).value || '';
      const password = (document.getElementById('password') || {}).value || '';

      if (!email || !password) {
        setText(errorMessage, 'Completa correo y contraseña.');
        show(errorMessage, true);
        return;
      }

      show(loadingBar, true);
      loginBtn.disabled = true;

      try {
        const resp = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const body = await resp.json();

        if (!resp.ok) {
          setText(errorMessage, body.error || 'Error al iniciar sesión');
          show(errorMessage, true);
          return;
        }

        setText(successMessage, 'Ingreso exitoso. Redirigiendo...');
        show(successMessage, true);

        localStorage.setItem('worship_session', 'active');

        setTimeout(() => {
          window.location.replace('../admin/admin.html');
        }, 900);

      } catch (err) {
        console.error(err);
        setText(errorMessage, 'Error de conexión');
        show(errorMessage, true);
      } finally {
        show(loadingBar, false);
        loginBtn.disabled = false;
      }
    });
  });
})();
