const { Op } = require('sequelize');
const sequelize = require('../config/database');
const ParametroSistema = require('../models/ParametroSistema');
const LogAuditoria = require('../models/LogAuditoria');
const { fechaHoy } = require('../utils/fecha');
const { obtenerIvaVigente } = require('../utils/impuestos');

// CU52 - Parámetros legales y tributarios editables desde Configuración.
// "campo" es el nombre que usa el formulario; "clave" es la fila en PARAMETRO_SISTEMA.
const PARAMETROS_TRIBUTARIOS = [
  { campo: 'iva', clave: 'iva_porcentaje', nombre: 'IVA' },
  { campo: 'retencion_honorarios', clave: 'retencion_honorarios_porcentaje', nombre: 'Retención de honorarios' }
];

// Acepta coma o punto decimal ("15,25" o "15.25"), como se escribe en Chile
function leerPorcentaje(valor) {
  const texto = valor === undefined || valor === null ? '' : String(valor).trim().replace(',', '.');
  if (texto === '') return { error: 'vacio' };
  if (!/^-?\d+(\.\d+)?$/.test(texto)) return { error: 'no_numerico' };
  const numero = Number(texto);
  if (numero < 0 || numero > 100 || !/^\d+(\.\d{1,2})?$/.test(texto)) return { error: 'fuera_de_rango' };
  return { numero };
}

async function getTributarios(req, res) {
  try {
    const filas = await ParametroSistema.findAll({
      where: { parametro_sistema_clave: { [Op.in]: PARAMETROS_TRIBUTARIOS.map(p => p.clave) } }
    });
    const data = PARAMETROS_TRIBUTARIOS.map(p => {
      const fila = filas.find(f => f.parametro_sistema_clave === p.clave);
      return {
        campo: p.campo,
        nombre: p.nombre,
        valor: fila ? Number(fila.parametro_sistema_valor) : null,
        fecha_vigencia: fila ? fila.parametro_sistema_fecha_vigencia : null
      };
    });
    return res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener los parámetros tributarios' });
  }
}

async function actualizarTributarios(req, res) {
  const lecturas = PARAMETROS_TRIBUTARIOS.map(p => ({ ...p, ...leerPorcentaje(req.body[p.campo]) }));
  const conError = tipo => lecturas.filter(l => l.error === tipo).map(l => l.campo);

  if (conError('vacio').length) {
    return res.status(400).json({ success: false, error: 'Completa los porcentajes de IVA y retención', campos: conError('vacio') });
  }
  if (conError('no_numerico').length) {
    // Excepción 1: Valor no numérico
    return res.status(400).json({ success: false, error: 'El valor ingresado no es numérico. Ingresa un número válido', campos: conError('no_numerico') });
  }
  if (conError('fuera_de_rango').length) {
    return res.status(400).json({ success: false, error: 'El porcentaje debe ser un número entre 0 y 100, con hasta 2 decimales', campos: conError('fuera_de_rango') });
  }

  const t = await sequelize.transaction();
  try {
    const cambios = [];
    for (const l of lecturas) {
      const fila = await ParametroSistema.findByPk(l.clave, { transaction: t, lock: t.LOCK.UPDATE });
      const anterior = fila ? Number(fila.parametro_sistema_valor) : null;
      if (anterior === l.numero) continue;
      if (fila) {
        await fila.update({ parametro_sistema_valor: l.numero, parametro_sistema_fecha_vigencia: fechaHoy() }, { transaction: t });
      } else {
        await ParametroSistema.create({ parametro_sistema_clave: l.clave, parametro_sistema_valor: l.numero, parametro_sistema_fecha_vigencia: fechaHoy() }, { transaction: t });
      }
      cambios.push({ nombre: l.nombre, anterior, nuevo: l.numero });
    }
    await t.commit();

    if (cambios.length === 0) {
      return res.json({ success: true, mensaje: 'Los valores no cambiaron: no hay nada que guardar', data: { cambios: 0 } });
    }

    const pct = v => v === null ? 'sin valor' : `${String(v).replace('.', ',')}%`;
    for (const c of cambios) {
      try {
        await LogAuditoria.create({
          log_auditoria_fecha_hora: new Date(),
          log_auditoria_accion: `${c.nombre} actualizado de ${pct(c.anterior)} a ${pct(c.nuevo)}`,
          log_auditoria_modulo: 'PARAMETRO',
          usuario_rut: req.user.rut
        });
      } catch (_) { /* log no crítico */ }
    }

    return res.json({ success: true, mensaje: 'Parámetros tributarios actualizados correctamente', data: { cambios: cambios.length } });
  } catch (err) {
    if (!t.finished) await t.rollback();
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al guardar los parámetros tributarios' });
  }
}

// CU53 - IVA vigente para mostrar el desglose antes de guardar un documento
async function getIvaVigente(req, res) {
  try {
    return res.json({ success: true, data: await obtenerIvaVigente() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener el IVA vigente' });
  }
}

module.exports = { getTributarios, actualizarTributarios, getIvaVigente };
