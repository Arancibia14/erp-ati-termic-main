// CU 18 / UR-F-20 - Alerta de contratos laborales que vencen en los próximos 30 días
const DIAS_ALERTA_CONTRATO = 30;
const DIA_MS = 24 * 60 * 60 * 1000;

// Días entre dos fechas YYYY-MM-DD, sin depender de la zona horaria del servidor
const diasEntre = (desde, hasta) =>
  Math.round((Date.parse(hasta + 'T00:00:00Z') - Date.parse(desde + 'T00:00:00Z')) / DIA_MS);

// Estado de vencimiento de un contrato respecto de hoy:
// "Vencido", "Por vencer" (dentro de los 30 días), "Vigente" o "Indefinido" (sin fecha de término)
function alertaContrato(fechaTermino, hoy) {
  if (!fechaTermino) return { estado: 'Indefinido', dias: null };
  const dias = diasEntre(hoy, fechaTermino);
  if (dias < 0) return { estado: 'Vencido', dias };
  if (dias <= DIAS_ALERTA_CONTRATO) return { estado: 'Por vencer', dias };
  return { estado: 'Vigente', dias };
}

module.exports = { DIAS_ALERTA_CONTRATO, alertaContrato };
