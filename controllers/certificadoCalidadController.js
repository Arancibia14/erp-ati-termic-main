const multer = require('multer');
const path = require('path');
const fs = require('fs');
const CertificadoCalidad = require('../models/CertificadoCalidad');
const GuiaDespacho = require('../models/GuiaDespacho');
const Material = require('../models/Material');
const Proveedor = require('../models/Proveedor');
const LogAuditoria = require('../models/LogAuditoria');

const FORMATOS_OK = ['.pdf', '.jpg', '.jpeg', '.png'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/certificados-calidad');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `calidad_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (FORMATOS_OK.includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      // Excepción 1: Formato de archivo no válido
      cb(new Error('Formato de archivo no válido. Solo se aceptan PDF o imagen (JPG, PNG).'));
    }
  }
});

function eliminarArchivo(urlRelativa) {
  if (!urlRelativa) return;
  fs.unlink(path.join(__dirname, '..', urlRelativa), () => {});
}

// CU38 - Ingresos de materiales recientes (guías) con estado de certificación
async function getIngresos(req, res) {
  try {
    const guias = await GuiaDespacho.findAll({
      include: [
        { model: Material, attributes: ['material_id', 'material_nombre', 'material_codigo_sku', 'material_unidad_medida'] },
        { model: Proveedor, attributes: ['proveedor_razon_social'] }
      ],
      order: [['guia_despacho_id', 'DESC']]
    });

    const certs = await CertificadoCalidad.findAll();
    const porGuia = {};
    certs.forEach(c => { porGuia[c.guia_despacho_id] = c; });

    const data = guias.map(g => ({
      guia_despacho_id: g.guia_despacho_id,
      guia_despacho_numero: g.guia_despacho_numero,
      guia_despacho_fecha: g.guia_despacho_fecha,
      material_id: g.material_id,
      material_nombre: g.Material?.material_nombre || `Material #${g.material_id}`,
      material_sku: g.Material?.material_codigo_sku || '',
      cantidad: g.guia_despacho_cantidad_recibida,
      proveedor: g.Proveedor?.proveedor_razon_social || '—',
      certificado: porGuia[g.guia_despacho_id]
        ? {
            numero: porGuia[g.guia_despacho_id].certificado_calidad_numero,
            url: porGuia[g.guia_despacho_id].certificado_calidad_url,
            fecha_emision: porGuia[g.guia_despacho_id].certificado_calidad_fecha_emision
          }
        : null
    }));

    return res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener los ingresos de materiales' });
  }
}

// CU38 - Historial de certificados de calidad por material
async function getHistorialMaterial(req, res) {
  try {
    const { materialId } = req.params;
    const certs = await CertificadoCalidad.findAll({
      where: { material_id: materialId },
      order: [['certificado_calidad_id', 'DESC']]
    });
    return res.json({ success: true, data: certs });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener el historial de certificados' });
  }
}

// CU38 - Cargar certificado de calidad
async function cargarCertificado(req, res) {
  try {
    const { guia_despacho_id, numero, fecha_emision } = req.body;
    const limpiar = () => { if (req.file) eliminarArchivo(`/uploads/certificados-calidad/${req.file.filename}`); };

    if (!guia_despacho_id || !numero || !numero.trim()) {
      limpiar();
      return res.status(400).json({ success: false, error: 'El ingreso de material y el número de certificado son obligatorios' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Se requiere adjuntar el archivo del certificado' });
    }

    const guia = await GuiaDespacho.findByPk(guia_despacho_id);
    if (!guia) {
      limpiar();
      return res.status(404).json({ success: false, error: 'El ingreso de material no existe' });
    }

    const existente = await CertificadoCalidad.findOne({ where: { guia_despacho_id } });
    if (existente) {
      limpiar();
      return res.status(409).json({ success: false, error: 'Este ingreso de material ya tiene un certificado de calidad cargado' });
    }

    let certificado;
    try {
      certificado = await CertificadoCalidad.create({
        guia_despacho_id,
        material_id: guia.material_id || null,
        certificado_calidad_numero: numero.trim(),
        certificado_calidad_url: `/uploads/certificados-calidad/${req.file.filename}`,
        certificado_calidad_fecha_emision: fecha_emision || null,
        certificado_calidad_fecha_carga: new Date().toISOString().split('T')[0],
        usuario_rut: req.user.rut
      });
    } catch (dbErr) {
      // Excepción 2: Error de almacenamiento
      console.error(dbErr);
      limpiar();
      return res.status(500).json({ success: false, error: 'No se pudo guardar el archivo en el servidor. Intenta nuevamente.' });
    }

    try {
      await LogAuditoria.create({
        log_auditoria_fecha_hora: new Date(),
        log_auditoria_accion: `Certificado de calidad ${numero.trim()} cargado para la guía ${guia.guia_despacho_numero}`,
        log_auditoria_modulo: 'CERTIFICADO_CALIDAD',
        usuario_rut: req.user.rut
      });
    } catch (_) { /* log no crítico */ }

    return res.status(201).json({
      success: true,
      data: { certificado, mensaje: 'Certificado almacenado exitosamente' }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al cargar el certificado de calidad' });
  }
}

module.exports = { upload, getIngresos, getHistorialMaterial, cargarCertificado };
