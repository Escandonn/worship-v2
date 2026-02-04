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
    // Intentar iniciar sesión con email/password
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      console.error('Sign-in error:', signInError);
      return res.status(401).json({ error: signInError.message || 'Credenciales inválidas' });
    }

    const user = data?.user || null;

    // Garantizar que exista una fila en la tabla `users` con este email
    try {
      const { data: existing, error: selectErr } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .limit(1)
        .maybeSingle();

      if (selectErr) console.error('Select users error:', selectErr);

      if (!existing) {
        const { error: insertErr } = await supabase.from('users').insert([
          {
            email: email,
            created_at: new Date().toISOString(),
            supabase_user_id: user?.id || null
          }
        ]);
        if (insertErr) console.error('Insert users error:', insertErr);
      }
    } catch (dbErr) {
      console.error('DB error ensuring users row:', dbErr);
    }

    // Devolver info mínima al cliente
    return res.status(200).json({ message: 'Login exitoso', user: { id: user?.id, email: user?.email } });

  } catch (err) {
    console.error('Login handler error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
