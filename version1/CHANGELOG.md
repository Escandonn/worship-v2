# CHANGELOG

## Unreleased

- feat(ui): hero full-screen con fondo tipo "matrix" en canvas 2D optimizado
  - Mueve el texto al DOM para garantizar que siempre esté por encima del efecto.
  - Reemplaza el pipeline pesado de Three.js por una animación canvas 2D más eficiente y con escalado DPR.
  - Añade control de `prefers-reduced-motion` y throttling a la animación para reducir uso de CPU en dispositivos limitados.
  - Implementa la técnica `--vh` para resolver problemas de 100vh en móviles.
  - Mejora accesibilidad y estructura semántica del HTML.

Commit message sugerido:

"feat(hero): hero full-screen con fondo matriz optimizado y texto en primer plano\n\n- Mover texto al DOM para evitar solapamientos y lag con la animación\n- Reemplazar Three.js por canvas 2D optimizado (DPR, throttling, reduced-motion)\n- Añadir CSS variables y --vh para soporte móvil"
