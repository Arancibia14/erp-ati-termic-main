const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ModeloHvac = require('../models/ModeloHvac');
const DocumentoEquipo = require('../models/DocumentoEquipo');
const LogAuditoria = require('../models/LogAuditoria');

const FORMATOS_OK = ['.pdf', '.jpg', '.jpeg', '.png'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/documentacion-equipos');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `equipo_doc_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (FORMATOS_OK.includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      // Excepción 1: Formato no compatible
      cb(new Error('Formato no compatible. Convierte el archivo a PDF o imagen (JPG, PNG).'));
    }
  }
});

function eliminarArchivo(urlRelativa) {
  if (!urlRelativa) return;
  fs.unlink(path.join(__dirname, '..', urlRelativa), () => {});
}

async function getModelos(req, res) {
  try {
    const modelos = await ModeloHvac.findAll({ order: [['modelo_hvac_nombre', 'ASC']] });
    return res.json({ success: true, data: modelos });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener el catálogo de equipos' });
  }
}

// CU NUEVO 1 - Dando de alta modelos de equipo HVAC
async function crearModelo(req, res) {
  try {
    const { nombre } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ success: false, error: 'El nombre del modelo es obligatorio' });
    }

    const existente = await ModeloHvac.findOne({ where: { modelo_hvac_nombre: nombre.trim() } });
    if (existente) {
      return res.status(409).json({ success: false, error: 'Ya existe un modelo con ese nombre en el catálogo' });
    }

    const modelo = await ModeloHvac.create({ modelo_hvac_nombre: nombre.trim() });

    try {
      await LogAuditoria.create({
        log_auditoria_fecha_hora: new Date(),
        log_auditoria_accion: `Modelo de equipo "${nombre.trim()}" dado de alta en el catálogo`,
        log_auditoria_modulo: 'MODELO_HVAC',
        usuario_rut: req.user.rut
      });
    } catch (_) { /* log no crítico */ }

    return res.status(201).json({ success: true, data: modelo });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al dar de alta el modelo de equipo' });
  }
}

async function getDocumentosModelo(req, res) {
  try {
    const { id } = req.params;
    const documentos = await DocumentoEquipo.findAll({
      where: { modelo_hvac_id: id },
      order: [['documento_equipo_id', 'DESC']]
    });
    return res.json({ success: true, data: documentos });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener la documentación del equipo' });
  }
}

// CU33 - Subiendo documentación técnica de equipos
async function subirDocumento(req, res) {
  try {
    const { id } = req.params;
    const { etiqueta } = req.body;

    const limpiar = () => { if (req.file) eliminarArchivo(`/uploads/documentacion-equipos/${req.file.filename}`); };

    const modelo = await ModeloHvac.findByPk(id);
    if (!modelo) {
      limpiar();
      return res.status(404).json({ success: false, error: 'El modelo de equipo no existe en el catálogo' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Se requiere adjuntar el archivo' });
    }

    if (!etiqueta || !etiqueta.trim()) {
      limpiar();
      return res.status(400).json({ success: false, error: 'Escribe una etiqueta para el documento (ej. Manual de Instalación)' });
    }

    let documento;
    try {
      documento = await DocumentoEquipo.create({
        modelo_hvac_id: modelo.modelo_hvac_id,
        documento_equipo_etiqueta: etiqueta.trim(),
        documento_equipo_url: `/uploads/documentacion-equipos/${req.file.filename}`,
        documento_equipo_formato: path.extname(req.file.originalname).replace('.', '').toLowerCase(),
        documento_equipo_fecha: new Date().toISOString().split('T')[0]
      });
    } catch (dbErr) {
      // Excepción 2: Error de almacenamiento
      console.error(dbErr);
      limpiar();
      return res.status(500).json({ success: false, error: 'No se pudo almacenar el archivo en el servidor. La subida fue abortada.' });
    }

    try {
      await LogAuditoria.create({
        log_auditoria_fecha_hora: new Date(),
        log_auditoria_accion: `Documento "${etiqueta.trim()}" adjuntado al modelo de equipo ${modelo.modelo_hvac_nombre} (#${modelo.modelo_hvac_id})`,
        log_auditoria_modulo: 'DOCUMENTACION_EQUIPO',
        usuario_rut: req.user.rut
      });
    } catch (_) { /* log no crítico */ }

    return res.status(201).json({ success: true, data: documento });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al subir la documentación del equipo' });
  }
}

module.exports = { upload, getModelos, crearModelo, getDocumentosModelo, subirDocumento };
