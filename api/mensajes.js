import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  try {
    const { nombre, apellido, email, numero } = req.body

    const { error } = await supabase
      .from('mensajes')
      .insert([{ nombre, apellido, email, numero }])

    if (error) throw error

    return res.status(200).json({ ok: true })

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
