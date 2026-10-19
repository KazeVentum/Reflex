// Fecha local YYYY-MM-DD. No usar toISOString() para esto: devuelve la fecha
// en UTC, así que una lectura a las 8 p. m. en Colombia (UTC-5) quedaba
// registrada como del día siguiente.
export function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
