const ParametroSistema = require('../models/ParametroSistema');
const LogAuditoria = require('../models/LogAuditoria');

// CU53 - Cálculo de impuestos en documentos financieros. Montos en pesos
// chilenos: el IVA se redondea a pesos enteros.

// IVA vigente configurado en el CU 52. Excepción 1: si no está configurado, 0%.
async function obtenerIvaVigente() {
  const fila = await ParametroSistema.findByPk('iva_porcentaje');
  if (!fila || fila.parametro_sistema_valor === null) return { porcentaje: 0, configurado: false };
  return { porcentaje: Number(fila.parametro_sistema_valor), configurado: true };
}

// Suma exacta a 2 decimales, sin errores de coma flotante (0,1 + 0,2)
const sumar = (a, b) => Math.round((a + b) * 100) / 100;

// El monto ingresado es neto: se le suma el IVA
function desgloseDesdeNeto(neto, porcentaje) {
  const n = Number(neto) || 0;
  const iva = Math.round(n * porcentaje / 100);
  return { neto: n, iva_porcentaje: porcentaje, iva, total: sumar(n, iva) };
}

// El monto ingresado ya trae el IVA incluido: se separa neto e IVA sin alterar el total
function desgloseDesdeTotal(total, porcentaje) {
  const t = Number(total) || 0;
  const iva = Math.round(t - t / (1 + porcentaje / 100));
  return { neto: sumar(t, -iva), iva_porcentaje: porcentaje, iva, total: t };
}

// Documento anterior al CU 53 (sin % guardado): se muestra tal como se registró
function desgloseGuardado(neto, porcentajeGuardado) {
  if (porcentajeGuardado === null || porcentajeGuardado === undefined) {
    const n = Number(neto) || 0;
    return { neto: n, iva_porcentaje: null, iva: null, total: n };
  }
  return desgloseDesdeNeto(neto, Number(porcentajeGuardado));
}

// Excepción 1 - Alerta al administrador: queda en el log de auditoría (CU 04)
async function alertarIvaNoConfigurado(documento, rut) {
  try {
    await LogAuditoria.create({
      log_auditoria_fecha_hora: new Date(),
      log_auditoria_accion: `ALERTA: el IVA no está configurado; ${documento} se calculó con 0%. Configúrelo en Parámetros Legales y Tributarios`,
      log_auditoria_modulo: 'PARAMETRO',
      usuario_rut: rut
    });
  } catch (_) { /* log no crítico */ }
}

const MENSAJE_IVA_NO_CONFIGURADO = 'El IVA no está configurado: el documento se calculó con 0%. Configúrelo en Parámetros Legales y Tributarios';

module.exports = {
  obtenerIvaVigente, desgloseDesdeNeto, desgloseDesdeTotal, desgloseGuardado,
  alertarIvaNoConfigurado, MENSAJE_IVA_NO_CONFIGURADO
};
