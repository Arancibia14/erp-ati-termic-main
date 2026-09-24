const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sequelize = require('../config/database');
const Proyecto = require('../models/Proyecto');
const EstadoProyecto = require('../models/EstadoProyecto');
const EgresoCajaChica = require('../models/EgresoCajaChica');
const LogAuditoria = require('../models/LogAuditoria');
const { fechaHoy, esFechaValida } = require('../utils/fecha');
const {
  obtenerIvaVigente, desgloseDesdeNeto, desgloseDesdeTotal, alertarIvaNoConfigurado, MENSAJE_IVA_NO_CONFIGURADO
} = require('../utils/impuestos');

// CU53 - Respuesta a "¿El monto que ingresaste ya incluye IVA?": true, false o null si falta
function leerIncluyeIva(valor) {
  if (valor === true || valor === 'si' || valor === 'true') return true;
  if (valor === false || valor === 'no' || valor === 'false') return false;
  return null;
}

async function getProyectos(req, res) {
  try {
    const proyectos = await Proyecto.findAll({
      include: [{ model: EstadoProyecto, attributes: ['estado_proyecto_nombre'] }]
    });
    return res.json({ success: true, data: proyectos });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener proyectos' });
  }
}

async function totalEgresos(codigo) {
  const [result] = await sequelize.query(
    'SELECT COALESCE(SUM(egreso_caja_chica_monto), 0) as total_egresos FROM EGRESO_CAJA_CHICA WHERE proyecto_codigo_correlativo = :codigo',
    { replacements: { codigo }, type: sequelize.QueryTypes.SELECT }
  );
  return parseFloat(result.total_egresos) || 0;
}

// El saldo de la caja chica sale del fondo asignado al proyecto, no de su
// presupuesto completo: el presupuesto de la obra también lo consumen las
// órdenes de compra, y usarlo aquí permitía gastar dos veces el mismo dinero.
async function calcularSaldo(proyecto) {
  const fondo = parseFloat(proyecto.proyecto_presupuesto_caja_chica) || 0;
  const egresos = await totalEgresos(proyecto.proyecto_codigo_correlativo);
  return { fondo_caja_chica: fondo, total_egresos: egresos, saldo_disponible: fondo - egresos };
}

async function getSaldo(req, res) {
  try {
    const { codigo } = req.params;
    const proyecto = await Proyecto.findByPk(codigo);
    if (!proyecto) {
      return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    }
    return res.json({ success: true, data: await calcularSaldo(proyecto) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al calcular saldo' });
  }
}

// Monto en pesos: un número, o un texto de solo dígitos con hasta 2 decimales.
// parseFloat("abc") da NaN y NaN <= 0 es falso, así que antes un monto no
// numérico pasaba la validación y el egreso se guardaba igual.
function leerMonto(valor) {
  if (typeof valor === 'number') return valor;
  if (typeof valor === 'string' && /^\s*\d+(\.\d{1,2})?\s*$/.test(valor)) return Number(valor);
  return NaN;
}

async function registrarEgreso(req, res) {
  try {
    const { proyecto_codigo_correlativo, egreso_caja_chica_monto, egreso_caja_chica_concepto, egreso_caja_chica_fecha, incluye_iva } = req.body;
    const concepto = typeof egreso_caja_chica_concepto === 'string' ? egreso_caja_chica_concepto.trim() : '';

    if (!proyecto_codigo_correlativo || !egreso_caja_chica_monto || !concepto) {
      return res.status(400).json({ success: false, error: 'Proyecto, monto y concepto son requeridos' });
    }

    const monto = leerMonto(egreso_caja_chica_monto);
    if (!Number.isFinite(monto) || monto <= 0) {
      return res.status(400).json({ success: false, error: 'El monto debe ser mayor a 0' });
    }

    const incluyeIva = leerIncluyeIva(incluye_iva);
    if (incluyeIva === null) {
      return res.status(400).json({ success: false, error: 'Indica si el monto que ingresaste ya incluye IVA', campos: ['incluye_iva'] });
    }

    // La fecha la ingresa el actor (paso 19 del CU 39): si viene, debe ser una
    // fecha real y no posterior a hoy. Sin fecha se usa la de hoy.
    const hoy = fechaHoy();
    const fecha = egreso_caja_chica_fecha || hoy;
    if (!esFechaValida(fecha)) {
      return res.status(400).json({ success: false, error: 'La fecha del egreso no es válida' });
    }
    if (fecha > hoy) {
      return res.status(400).json({ success: false, error: 'La fecha del egreso no puede ser posterior a hoy' });
    }

    const proyecto = await Proyecto.findByPk(proyecto_codigo_correlativo);
    if (!proyecto) {
      return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    }

    const { fondo_caja_chica: fondo, saldo_disponible: saldo } = await calcularSaldo(proyecto);
    if (fondo <= 0) {
      return res.status(400).json({
        success: false,
        error: 'El proyecto no tiene fondo de caja chica asignado. El administrador debe asignarlo en Configuración.'
      });
    }

    // CU53 - Si ya incluye IVA se descuenta tal cual; si no, se le suma el IVA vigente
    const iva = await obtenerIvaVigente();
    const desglose = incluyeIva ? desgloseDesdeTotal(monto, iva.porcentaje) : desgloseDesdeNeto(monto, iva.porcentaje);

    if (desglose.total > saldo) {
      return res.status(400).json({
        success: false,
        error: `Saldo insuficiente. Saldo disponible: $${saldo.toLocaleString('es-CL')}`
      });
    }

    const egreso = await EgresoCajaChica.create({
      egreso_caja_chica_monto: desglose.total,
      egreso_caja_chica_monto_neto: desglose.neto,
      egreso_caja_chica_iva_porcentaje: desglose.iva_porcentaje,
      egreso_caja_chica_fecha: fecha,
      egreso_caja_chica_concepto: concepto,
      proyecto_codigo_correlativo,
      usuario_rut: req.user.rut
    });
    if (!iva.configurado) await alertarIvaNoConfigurado(`el egreso de caja chica #${egreso.egreso_caja_chica_id}`, req.user.rut);

    try {
      await LogAuditoria.create({
        log_auditoria_fecha_hora: new Date(),
        log_auditoria_accion: `Egreso de $${desglose.total} registrado en proyecto ${proyecto_codigo_correlativo} (neto $${desglose.neto} + IVA $${desglose.iva})`,
        log_auditoria_modulo: 'CAJA_CHICA',
        usuario_rut: req.user.rut
      });
    } catch (_) { /* log no crítico */ }

    return res.status(201).json({
      success: true,
      data: egreso,
      desglose,
      alerta: iva.configurado ? null : MENSAJE_IVA_NO_CONFIGURADO
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al registrar egreso' });
  }
}

async function getEgresosByProyecto(req, res) {
  try {
    const { codigo } = req.params;
    const egresos = await EgresoCajaChica.findAll({
      where: { proyecto_codigo_correlativo: codigo },
      order: [['egreso_caja_chica_fecha', 'DESC'], ['egreso_caja_chica_id', 'DESC']]
    });
    return res.json({ success: true, data: egresos });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener egresos' });
  }
}

// CU40 - Adjuntando comprobante de gasto: foto de la boleta o PDF electrónico
const COMPROBANTE_LIMITE_MB = 10;
const COMPROBANTE_FORMATOS = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.pdf': 'application/pdf'
};

const uploadComprobante = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, '../uploads/comprobantes');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      cb(null, `comprobante_${req.params.id}_${Date.now()}${path.extname(file.originalname).toLowerCase()}`);
    }
  }),
  limits: { fileSize: COMPROBANTE_LIMITE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // Paso 3 - Formato válido: la extensión y el tipo real del archivo deben coincidir
    const ext = path.extname(file.originalname).toLowerCase();
    if (COMPROBANTE_FORMATOS[ext] && COMPROBANTE_FORMATOS[ext] === file.mimetype) return cb(null, true);
    cb(new Error('Formato no válido. El comprobante debe ser una imagen JPG, PNG o WEBP, o un PDF'));
  }
});

// Traduce los fallos de multer a mensajes para el actor
function recibirComprobante(req, res, next) {
  uploadComprobante.single('comprobante')(req, res, err => {
    if (!err) return next();
    const error = err.code === 'LIMIT_FILE_SIZE'
      ? `El archivo supera el límite de ${COMPROBANTE_LIMITE_MB} MB`
      : err.message || 'Error al procesar el archivo';
    return res.status(400).json({ success: false, error, campos: ['comprobante'] });
  });
}

async function adjuntarComprobante(req, res) {
  const borrarSubido = () => { if (req.file) fs.unlink(req.file.path, () => {}); };
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Toma una foto de la boleta o selecciona un archivo', campos: ['comprobante'] });
    }
    const egreso = await EgresoCajaChica.findByPk(req.params.id);
    if (!egreso) {
      borrarSubido();
      return res.status(404).json({ success: false, error: 'El egreso no existe' });
    }
    // Postcondición: el respaldo es inmutable. Solo se escribe si sigue vacío en ese
    // instante, así dos cargas simultáneas no pueden pisarse.
    const url = `/uploads/comprobantes/${req.file.filename}`;
    const [actualizados] = await EgresoCajaChica.update(
      { egreso_caja_chica_url_comprobante: url },
      { where: { egreso_caja_chica_id: egreso.egreso_caja_chica_id, egreso_caja_chica_url_comprobante: null } }
    );
    if (actualizados === 0) {
      borrarSubido();
      return res.status(409).json({ success: false, error: 'Este egreso ya tiene un comprobante guardado y no se puede reemplazar' });
    }
    egreso.egreso_caja_chica_url_comprobante = url;

    try {
      await LogAuditoria.create({
        log_auditoria_fecha_hora: new Date(),
        log_auditoria_accion: `Comprobante adjuntado al egreso de caja chica #${egreso.egreso_caja_chica_id} del proyecto ${egreso.proyecto_codigo_correlativo}`,
        log_auditoria_modulo: 'CAJA_CHICA',
        usuario_rut: req.user.rut
      });
    } catch (_) { /* log no crítico */ }

    return res.status(201).json({ success: true, mensaje: 'Comprobante guardado correctamente', data: egreso });
  } catch (err) {
    borrarSubido();
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al guardar el comprobante' });
  }
}

module.exports = { getProyectos, getSaldo, registrarEgreso, getEgresosByProyecto, recibirComprobante, adjuntarComprobante };
