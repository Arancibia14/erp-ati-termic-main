// Fecha y hora locales del navegador, en los formatos de <input type="date">
// (YYYY-MM-DD) y <input type="datetime-local"> (YYYY-MM-DDTHH:mm).
// toISOString() entrega la hora UTC: adelanta la hora y, desde las 21:00, la fecha.
const dos = n => String(n).padStart(2, '0');

export function fechaLocal(fecha = new Date()) {
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

export function fechaHoraLocal(fecha = new Date()) {
  return `${fechaLocal(fecha)}T${dos(fecha.getHours())}:${dos(fecha.getMinutes())}`;
}
