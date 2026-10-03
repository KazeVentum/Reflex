# Changelog

Resumen breve de cambios y problemas resueltos en este proyecto (sesión de trabajo con Claude).

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
