const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Proyecto = require('../models/Proyecto');
const EstadoProyecto = require('../models/EstadoProyecto');
const Trabajador = require('../models/Trabajador');
const IncidenteSSO = require('../models/IncidenteSSO');
const Accidente = require('../models/Accidente');
const LogAuditoria = require('../models/LogAuditoria');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/sso');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `sso_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

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

async function getTrabajadores(req, res) {
  try {
    const { codigo } = req.params;
    const trabajadores = await Trabajador.findAll({
      where: { proyecto_codigo_correlativo: codigo }
    });
    return res.json({ success: true, data: trabajadores });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener trabajadores' });
  }
}

async function registrarIncidente(req, res) {
  try {
    const {
      proyecto_codigo_correlativo,
      incidente_sso_descripcion,
      incidente_sso_gravedad,
      incidente_sso_tipo,
      incidente_sso_lugar,
      incidente_sso_fecha_hora,
      trabajadores_involucrados
    } = req.body;

    if (!proyecto_codigo_correlativo || !incidente_sso_descripcion || !incidente_sso_gravedad || !incidente_sso_tipo) {
      return res.status(400).json({ success: false, error: 'Proyecto, tipo, descripción y gravedad son requeridos' });
    }

    let trabajadoresArray = [];
    if (trabajadores_involucrados) {
      try {
        trabajadoresArray = typeof trabajadores_involucrados === 'string'
          ? JSON.parse(trabajadores_involucrados)
          : trabajadores_involucrados;
      } catch {
        trabajadoresArray = [];
      }
    }

    for (const tw of trabajadoresArray) {
      const trabajador = await Trabajador.findOne({
        where: { trabajador_rut: tw.rut, proyecto_codigo_correlativo }
      });
      if (!trabajador) {
        return res.status(400).json({
          success: false,
          error: `El trabajador ${tw.rut} no está asignado a este proyecto`
        });
      }
    }

    let urlFotos = null;
    if (req.files && req.files.length > 0) {
      urlFotos = JSON.stringify(req.files.map(f => `/uploads/sso/${f.filename}`));
    }

    const incidente = await IncidenteSSO.create({
      incidente_sso_descripcion,
      incidente_sso_fecha_hora: incidente_sso_fecha_hora || new Date(),
      incidente_sso_gravedad,
      incidente_sso_tipo: incidente_sso_tipo || null,
      incidente_sso_lugar: incidente_sso_lugar || null,
      incidente_sso_url_fotos: urlFotos,
      proyecto_codigo_correlativo
    });

    for (const tw of trabajadoresArray) {
      if (tw.dias_perdidos !== undefined) {
        await Accidente.create({
          accidente_dias_perdidos: tw.dias_perdidos || 0,
          accidente_riesgo_potencial: tw.riesgo_potencial || 'Sin especificar',
          incidente_sso_id: incidente.incidente_sso_id,
          trabajador_rut: tw.rut,
          proyecto_codigo_correlativo
        });
      }
    }

    await LogAuditoria.create({
      log_auditoria_fecha_hora: new Date(),
      log_auditoria_accion: `Incidente SSO registrado en proyecto ${proyecto_codigo_correlativo} (gravedad: ${incidente_sso_gravedad})`,
      log_auditoria_modulo: 'SSO',
      usuario_rut: req.user.rut
    });

    return res.status(201).json({ success: true, data: incidente });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al registrar incidente' });
  }
}

module.exports = { getProyectos, getTrabajadores, registrarIncidente, upload };
