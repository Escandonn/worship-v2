import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Faltan parámetros: email y password' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Error de configuración: Faltan credenciales de Supabase' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Buscar usuario en la tabla `users` por email
    const { data: users, error: selectErr } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1)
      .maybeSingle();

    if (selectErr) {
      console.error('Select users error:', selectErr);
      return res.status(500).json({ error: 'Error al consultar usuarios' });
    }

    if (!users) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    // Comparar contraseña
    if (users.password !== password) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // Devolver info mínima al cliente
    return res.status(200).json({ message: 'Login exitoso', user: { email: users.email } });

  } catch (err) {
    console.error('Login handler error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
