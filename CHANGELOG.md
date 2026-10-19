# Changelog

Resumen breve de cambios y problemas resueltos en este proyecto (sesión de trabajo con Claude).

## 2026-10-19

- **Bug: un libro terminado seguía en "En progreso"** (Blackwater, 250/250). El inicio mostraba todos los libros con total de páginas. Fix: solo los no terminados; en `/books` se separan en *Leyendo* y *Terminados*.
- **Publicar sin pasar por "Editar"**: el interruptor "Hacer pública" ahora está también al crear reflexiones y citas (componente compartido `PublicToggle`), y las tarjetas muestran una etiqueta "Pública". El texto del interruptor decía "si estás destacado", que ya no aplicaba.
- **Reflexiones escritas**: además de grabar, puedes escribir una reflexión o reseña vinculada a un libro (desde el inicio o la biblioteca). `reflections.audio_path` pasa a ser opcional, con un `CHECK` que exige audio o texto.
- **"Agregar libro" opcional**: el formulario ya no aparece siempre en `/books`; se abre con un botón, y si no hay libros se muestra un estado vacío.
- **Historial de lectura**: cada día guarda de qué página a cuál leíste (*pág. 187 → 230*); `reading_logs.start_page`/`end_page` y la función nueva `log_reading()`. Si corriges una página a la baja, el registro del día se recorta en vez de dejar páginas fantasma.
- **Mapa de actividad rediseñado**: de una semana a 6 meses tipo GitHub (4 en móvil, con celdas más grandes), con racha, páginas y días del mes. Si tocas un día, el historial se filtra.
- **Libro terminado**: al guardar la última página aparece una celebración con el atajo "Escribir una reseña".
- **Vista previa del audio** antes de guardar una grabación; "Descartar" pide confirmación.
- **Bug de seguridad**: `upsert_reading_log` (`SECURITY DEFINER`) confiaba en un `p_user_id` enviado por el cliente, así que cualquiera podía escribir registros de lectura de otro. Fix: usa `auth.uid()` y verifica que el libro sea del usuario. Tras confirmar el deploy en prod, se eliminó (ahora todo pasa por `log_reading()`).
- **Bug: lecturas de la noche quedaban en el día siguiente.** La fecha se calculaba en UTC (`toISOString`); en Colombia (UTC-5), todo lo registrado después de las 7 p. m. caía en mañana. Fix: fecha local (`src/lib/date.ts`).
- **UX general**: el formulario de reflexión ahora es más ancho y alineado con el resto de páginas; se corrigió el botón "+" de libro que se salía de la columna; el Feed vacío ahora explica qué hacer; la biblioteca tiene botones para grabar o escribir.
- **Bug mobile: los botones flotantes (configuración, salir, tema) tapaban "Agregar libro"** y, al hacer scroll, el contenido. Fix: más espacio arriba en las páginas que lo necesitaban, y en móvil esos botones ahora se van con el scroll.
- README reescrito con funcionalidades, capturas actuales (`docs/screenshots/`) y guía de desarrollo.

## 2026-10-03

- **Bug mobile: el botón de grabar quedaba empujado muy abajo** cuando había varios libros "en progreso" (dependía del alto de esa columna). Fix: el botón ahora vive en la columna izquierda, cuyo alto es predecible.
- **Bug mobile: la píldora de navegación se salía del viewport** en pantallas angostas (ítems de ancho fijo sumaban más que el ancho real del teléfono). Rediseño: los ítems inactivos son solo ícono (círculos parejos), el activo se expande mostrando su nombre, con animación spring al cambiar. Se agregó un tope duro de ancho como red de seguridad.
- **Bug mobile: el título de la página chocaba con los íconos de arriba a la derecha** en títulos largos ("Autores destacados", el saludo con nombre). Fix: más espacio vertical arriba en mobile para que el título quede siempre debajo de los íconos, con todo el ancho disponible (en vez de angostar el texto, que lo partía en varias líneas feas).
- **"Mi perfil"/"Admin" en mobile**: no entraban ni en la píldora ni como íconos sueltos arriba (se solapaban con el título). Quedaron dentro del menú de Configuración, a un toque, solo en mobile — en desktop siguen en el Sidebar.
- **Perfil rediseñado + "Mi perfil" en el nav**: el perfil pasó de "nombre + lista" a un muro cronológico (reflexiones y citas mezcladas por fecha, estilo nota al margen) con encabezado y estadísticas. Se agregó acceso visible en Sidebar/BottomNav (antes solo estaba escondido en Configuración) y edición de nombre inline directo en el perfil, con lápiz junto al nombre.
- **Bug de UI: el perfil se veía centrado distinto al resto de la app.** Causa: un `mx-auto` angostando la columna independiente del layout estándar. Fix: mismo ancho de `<main>` que usan todas las páginas, columna de lectura anclada a la izquierda.
- **Saludo con nombre**: "Buenas tardes, {nombre}" en Home, usando un hook compartido (`useMyProfile`) que también sincroniza Configuración y el perfil en tiempo real.
- **Barra de búsqueda en `/feed`**: buscar cualquier perfil visible por nombre, no solo destacados — "destacado" ahora solo cura el índice, no decide si alguien es encontrable.
- **Nombre público editable + verificado**: cada usuario puede cambiar su nombre público desde Configuración. Admin puede marcar "verificado" (ícono de pluma) desde `/admin/users`.
- **Bug: libros/reflexiones de un usuario aparecían en la lista de otro.** Causa: las páginas privadas confiaban solo en RLS, que ahora también permite ver contenido público ajeno. Fix: filtro explícito por usuario en los hooks.
- **Compartir ya no depende de estar destacado**: cualquier usuario puede hacer pública una reflexión/cita y que aparezca en su propio perfil. "Destacado" ahora solo controla qué autores aparecen en el índice `/feed`.
- **Bug grave: recursión infinita en RLS** rompía las consultas de `profiles`, `books`, `reflections` y `quotes` (error 500 en todo). Causa: una política de `profiles` se consultaba a sí misma. Fix: función `is_admin()` que evita el ciclo.
- **Lentitud al navegar** (300-900ms por click): el middleware validaba la sesión contra el servidor de Supabase en cada request. Fix: verificación local del JWT (`getClaims()`), ya que el proyecto tiene clave de firma asimétrica.
- Se conectó el servidor MCP de Supabase (OAuth, sin compartir password) para poder aplicar migraciones y diagnosticar directo sobre la base real.

## 2026-09-29

- Se agregaron roles de usuario (`profiles`, `is_admin`, `is_featured`) y el panel `/admin/users`.
- Se agregó el feed de autores destacados (`/feed`) con reflexiones/citas públicas y audio reproducible.

## 2026-09-28

- Se restauró la paleta "Rosa" (tema alternativo) que se había perdido en un `git stash` nunca comiteado.

## Antes (resumen del proyecto)

- Rediseño responsive completo (mobile + desktop), rebrand a "Reflex", fondo aurora en login, tracker de progreso de lectura con heatmap.
