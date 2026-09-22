// Fechas del negocio en hora de Chile, independientes de la zona horaria del
// servidor. new Date().toISOString() entrega la fecha en UTC: desde las 21:00
// (UTC-3) devolvería el día siguiente.
const ZONA_HORARIA = 'America/Santiago';

const formato = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_HORARIA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

// Fecha en formato YYYY-MM-DD, el que usan las columnas DATEONLY
function fechaHoy(fecha = new Date()) {
  const partes = Object.fromEntries(formato.formatToParts(fecha).map(p => [p.type, p.value]));
  return `${partes.year}-${partes.month}-${partes.day}`;
}

// Fecha real en formato YYYY-MM-DD: rechaza otros formatos y días que no
// existen, como el 30 de febrero
function esFechaValida(fecha) {
  if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const [a, m, d] = fecha.split('-').map(Number);
  const f = new Date(Date.UTC(a, m - 1, d));
  return f.getUTCFullYear() === a && f.getUTCMonth() === m - 1 && f.getUTCDate() === d;
}

module.exports = { ZONA_HORARIA, fechaHoy, esFechaValida };
