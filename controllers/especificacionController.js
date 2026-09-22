// CU13 - Gestionando Especificaciones Técnicas.
// La carga la hacen el Administrador Total y el Supervisor de Obra, por eso vive
// fuera de /setup, que es solo del administrador.
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Proyecto = require('../models/Proyecto');
const EstadoProyecto = require('../models/EstadoProyecto');
const DocumentoLegal = require('../models/DocumentoLegal');
const LogAuditoria = require('../models/LogAuditoria');
const { fechaHoy } = require('../utils/fecha');

// La especificación técnica se guarda como un documento del proyecto, con este
// tipo. Así queda además visible en el buscador de documentos por obra (CU47).
const TIPO = 'Especificación Técnica';
const LIMITE_MB = 15;
const LIMITE_BYTES = LIMITE_MB * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/especificaciones');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `especificacion_${req.params.codigo}_${Date.now()}.pdf`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: LIMITE_BYTES },
  fileFilter: (req, file, cb) => {
    // CU13 Excepción 1 - Solo se admiten archivos PDF
    const esPdf = path.extname(file.originalname).toLowerCase() === '.pdf'
      && file.mimetype === 'application/pdf';
    if (esPdf) return cb(null, true);
    const error = new Error('Solo se admiten archivos PDF. Convierte la especificación a PDF antes de cargarla.');
    error.codigoExcepcion = 'FORMATO';
    cb(error);
  }
});

// Traduce los fallos de multer a los mensajes de las excepciones del caso de uso
function subirEspecificacion(req, res, next) {
  upload.single('archivo')(req, res, err => {
    if (!err) return next();
    // CU13 Excepción 2 - El archivo excede el tamaño máximo
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: `El archivo supera el límite de ${LIMITE_MB} MB. Comprime el PDF o divídelo antes de cargarlo.`,
        excepcion: 'TAMANO'
      });
    }
    return res.status(400).json({
      success: false,
      error: err.message || 'Error al procesar el archivo',
      excepcion: err.codigoExcepcion || 'ARCHIVO'
    });
  });
}

const audit = async (accion, modulo, rut) => {
  try {
    await LogAuditoria.create({
      log_auditoria_fecha_hora: new Date(),
      log_auditoria_accion: accion,
      log_auditoria_modulo: modulo,
      usuario_rut: rut
    });
  } catch (_) { /* no bloquear la operación principal */ }
};

// CU13 paso 1 - Ficha del proyecto y sus especificaciones ya cargadas
async function getEspecificaciones(req, res) {
  try {
    const { codigo } = req.params;
    const proyecto = await Proyecto.findByPk(codigo, {
      include: [{ model: EstadoProyecto, attributes: ['estado_proyecto_nombre'] }]
    });
    if (!proyecto) return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });

    const documentos = await DocumentoLegal.findAll({
      where: { proyecto_codigo_correlativo: codigo, documento_legal_tipo: TIPO },
      order: [['documento_legal_id', 'DESC']]
    });

    // Un registro puede apuntar a un archivo que ya no está en el servidor
    const conEstado = documentos.map(d => ({
      ...d.toJSON(),
      archivo_disponible: fs.existsSync(path.join(__dirname, '..', d.documento_legal_url_pdf))
    }));

    return res.json({ success: true, data: { proyecto, documentos: conEstado, limite_mb: LIMITE_MB } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener las especificaciones técnicas' });
  }
}

// CU13 pasos 4 y 5 - Validar, almacenar y vincular el archivo al proyecto
async function cargarEspecificacion(req, res) {
  const borrarSubido = () => {
    if (req.file) fs.unlink(req.file.path, () => {});
  };
  try {
    const { codigo } = req.params;
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Selecciona el archivo PDF de la especificación técnica' });
    }

    const proyecto = await Proyecto.findByPk(codigo);
    if (!proyecto) {
      borrarSubido();
      return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    }

    const documento = await DocumentoLegal.create({
      documento_legal_tipo: TIPO,
      documento_legal_url_pdf: `/uploads/especificaciones/${req.file.filename}`,
      documento_legal_fecha_emision: fechaHoy(),
      documento_legal_estado: 'Vigente',
      proyecto_codigo_correlativo: codigo
    });

    await audit(`Especificación técnica cargada en el proyecto ${codigo}`, 'ESPECIFICACION', req.user.rut);
    return res.status(201).json({
      success: true,
      data: documento,
      mensaje: `Documento vinculado exitosamente al proyecto ${codigo}`
    });
  } catch (err) {
    console.error(err);
    borrarSubido();
    return res.status(500).json({ success: false, error: 'Error al cargar la especificación técnica' });
  }
}

module.exports = { subirEspecificacion, getEspecificaciones, cargarEspecificacion };
