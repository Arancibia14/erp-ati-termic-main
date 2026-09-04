const multer = require('multer');
const path = require('path');
const fs = require('fs');
const CertificadoLaboral = require('../models/CertificadoLaboral');
const Proyecto = require('../models/Proyecto');
const LogAuditoria = require('../models/LogAuditoria');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/certificados-laborales');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
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

async function getCertificadosProyecto(req, res) {
  try {
    const { codigo } = req.params;
    const certificados = await CertificadoLaboral.findAll({
      where: { proyecto_codigo_correlativo: codigo },
      order: [['certificado_laboral_periodo', 'DESC']]
    });
    return res.json({ success: true, data: certificados });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener certificados de cumplimiento' });
  }
}

async function cargarCertificados(req, res) {
  try {
    const { proyecto_codigo_correlativo, periodo, reemplazar } = req.body;
    const archivoF30 = req.files?.f30?.[0];
    const archivoF30_1 = req.files?.f30_1?.[0];

    if (!proyecto_codigo_correlativo || !periodo) {
      return res.status(400).json({ success: false, error: 'Proyecto y periodo son obligatorios' });
    }

    if (!/^\d{4}-\d{2}$/.test(periodo)) {
      return res.status(400).json({ success: false, error: 'El periodo debe tener el formato AAAA-MM' });
    }

    if (!archivoF30 && !archivoF30_1) {
      return res.status(400).json({ success: false, error: 'Debes adjuntar al menos un archivo F30 o F30-1' });
    }

    const proyecto = await Proyecto.findByPk(proyecto_codigo_correlativo);
    if (!proyecto) {
      if (archivoF30) eliminarArchivo(`/uploads/certificados-laborales/${archivoF30.filename}`);
      if (archivoF30_1) eliminarArchivo(`/uploads/certificados-laborales/${archivoF30_1.filename}`);
      return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    }

    const existente = await CertificadoLaboral.findOne({
      where: { proyecto_codigo_correlativo, certificado_laboral_periodo: periodo }
    });

    if (existente && reemplazar !== 'true') {
      if (archivoF30) eliminarArchivo(`/uploads/certificados-laborales/${archivoF30.filename}`);
      if (archivoF30_1) eliminarArchivo(`/uploads/certificados-laborales/${archivoF30_1.filename}`);
      return res.json({ success: true, data: { periodo_completo: true, existente } });
    }

    let certificado;
    if (existente) {
      if (archivoF30) {
        eliminarArchivo(existente.certificado_laboral_url_f30);
        existente.certificado_laboral_url_f30 = `/uploads/certificados-laborales/${archivoF30.filename}`;
      }
      if (archivoF30_1) {
        eliminarArchivo(existente.certificado_laboral_url_f30_1);
        existente.certificado_laboral_url_f30_1 = `/uploads/certificados-laborales/${archivoF30_1.filename}`;
      }
      existente.certificado_laboral_fecha_carga = new Date().toISOString().split('T')[0];
      await existente.save();
      certificado = existente;
    } else {
      certificado = await CertificadoLaboral.create({
        proyecto_codigo_correlativo,
        certificado_laboral_periodo: periodo,
        certificado_laboral_url_f30: archivoF30 ? `/uploads/certificados-laborales/${archivoF30.filename}` : null,
        certificado_laboral_url_f30_1: archivoF30_1 ? `/uploads/certificados-laborales/${archivoF30_1.filename}` : null,
        certificado_laboral_fecha_carga: new Date().toISOString().split('T')[0]
      });
    }

    try {
      await LogAuditoria.create({
        log_auditoria_fecha_hora: new Date(),
        log_auditoria_accion: `Certificados de cumplimiento laboral (${periodo}) cargados para proyecto ${proyecto_codigo_correlativo}`,
        log_auditoria_modulo: 'CERTIFICADO_LABORAL',
        usuario_rut: req.user.rut
      });
    } catch (_) { /* log no crítico */ }

    return res.status(201).json({ success: true, data: certificado });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al cargar los certificados' });
  }
}

module.exports = { upload, getCertificadosProyecto, cargarCertificados };
