import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Solo permitir peticiones POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { nombre, apellido, email, numero } = req.body;

  // Configuración de Supabase
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Error de configuración: Faltan credenciales de Supabase' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { error } = await supabase
    .from('mensajes')
    .insert([{ nombre, apellido, email, numero }]);

  if (error) {
    console.error('Error Supabase:', error);
    return res.status(500).json({ error: 'Error al guardar el mensaje' });
  }

  return res.status(200).json({ message: 'Mensaje guardado correctamente' });
}
