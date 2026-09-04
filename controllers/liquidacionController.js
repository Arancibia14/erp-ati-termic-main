const multer = require('multer');
const path = require('path');
const fs = require('fs');
const LiquidacionSueldo = require('../models/LiquidacionSueldo');
const Trabajador = require('../models/Trabajador');
const LogAuditoria = require('../models/LogAuditoria');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/liquidaciones');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `liquidacion_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'));
    }
  }
});

function eliminarArchivo(urlRelativa) {
  if (!urlRelativa) return;
  const ruta = path.join(__dirname, '..', urlRelativa);
  fs.unlink(ruta, () => {});
}

async function getLiquidacionesTrabajador(req, res) {
  try {
    const { rut } = req.params;
    const liquidaciones = await LiquidacionSueldo.findAll({
      where: { trabajador_rut: rut },
      order: [['liquidacion_sueldo_periodo', 'DESC']]
    });
    return res.json({ success: true, data: liquidaciones });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener liquidaciones de sueldo' });
  }
}

async function cargarLiquidacion(req, res) {
  try {
    const { trabajador_rut, periodo, reemplazar } = req.body;

    if (!trabajador_rut || !periodo) {
      if (req.file) eliminarArchivo(`/uploads/liquidaciones/${req.file.filename}`);
      return res.status(400).json({ success: false, error: 'Trabajador y periodo son obligatorios' });
    }

    if (!/^\d{4}-\d{2}$/.test(periodo)) {
      if (req.file) eliminarArchivo(`/uploads/liquidaciones/${req.file.filename}`);
      return res.status(400).json({ success: false, error: 'El periodo debe tener el formato AAAA-MM' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Se requiere el archivo PDF de la liquidación' });
    }

    const trabajador = await Trabajador.findByPk(trabajador_rut);
    if (!trabajador) {
      eliminarArchivo(`/uploads/liquidaciones/${req.file.filename}`);
      return res.status(404).json({ success: false, error: 'Trabajador no encontrado' });
    }

    const existente = await LiquidacionSueldo.findOne({
      where: { trabajador_rut, liquidacion_sueldo_periodo: periodo }
    });

    if (existente && reemplazar !== 'true') {
      eliminarArchivo(`/uploads/liquidaciones/${req.file.filename}`);
      return res.json({ success: true, data: { duplicado: true, existente } });
    }

    let liquidacion;
    if (existente) {
      eliminarArchivo(existente.liquidacion_sueldo_url_pdf);
      existente.liquidacion_sueldo_url_pdf = `/uploads/liquidaciones/${req.file.filename}`;
      existente.liquidacion_sueldo_fecha_carga = new Date().toISOString().split('T')[0];
      await existente.save();
      liquidacion = existente;
    } else {
      liquidacion = await LiquidacionSueldo.create({
        trabajador_rut,
        liquidacion_sueldo_periodo: periodo,
        liquidacion_sueldo_url_pdf: `/uploads/liquidaciones/${req.file.filename}`,
        liquidacion_sueldo_fecha_carga: new Date().toISOString().split('T')[0]
      });
    }

    try {
      await LogAuditoria.create({
        log_auditoria_fecha_hora: new Date(),
        log_auditoria_accion: `Liquidación de sueldo (${periodo}) cargada para trabajador ${trabajador_rut}`,
        log_auditoria_modulo: 'LIQUIDACION_SUELDO',
        usuario_rut: req.user.rut
      });
    } catch (_) { /* log no crítico */ }

    return res.status(201).json({ success: true, data: liquidacion });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al cargar la liquidación' });
  }
}

module.exports = { upload, getLiquidacionesTrabajador, cargarLiquidacion };
