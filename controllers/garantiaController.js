const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const EquipoHVAC = require('../models/EquipoHVAC');
const ModeloHvac = require('../models/ModeloHvac');
const Proyecto = require('../models/Proyecto');
const DocumentoLegal = require('../models/DocumentoLegal');
const LogAuditoria = require('../models/LogAuditoria');
const { fechaHoy, esFechaValida } = require('../utils/fecha');

const TIPO_GARANTIA = 'Certificado de Garantía';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/garantias');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `garantia_${Date.now()}${path.extname(file.originalname)}`);
  }
});

// CU43 - La ficha pide específicamente "el archivo PDF de la garantía": solo PDF
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.pdf') {
      cb(null, true);
    } else {
      cb(new Error('El certificado de garantía debe ser un archivo PDF'));
    }
  }
});

function eliminarArchivo(urlRelativa) {
  if (!urlRelativa) return;
  fs.unlink(path.join(__dirname, '..', urlRelativa), () => {});
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

// CU NUEVO 7 - Cargando certificados de garantía de equipos
async function cargarGarantia(req, res) {
  try {
    const { numero_serie } = req.params;
    const { fecha_vencimiento } = req.body;

    const limpiar = () => { if (req.file) eliminarArchivo(`/uploads/garantias/${req.file.filename}`); };

    const equipo = await EquipoHVAC.findByPk(numero_serie);
    if (!equipo) {
      limpiar();
      return res.status(404).json({ success: false, error: 'El equipo no existe en el catálogo' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Se requiere adjuntar el certificado en PDF', campos: ['archivo'] });
    }

    if (!fecha_vencimiento || !esFechaValida(fecha_vencimiento)) {
      limpiar();
      return res.status(400).json({
        success: false,
        error: 'Ingresa la fecha de vencimiento de la garantía',
        campos: ['fecha_vencimiento']
      });
    }

    // Reemplaza cualquier certificado anterior de este equipo (no se acumulan versiones vencidas)
    const anterior = await DocumentoLegal.findOne({
      where: { equipo_hvac_numero_serie: numero_serie, documento_legal_tipo: TIPO_GARANTIA }
    });
    if (anterior) {
      eliminarArchivo(anterior.documento_legal_url_pdf);
      await anterior.destroy();
    }

    const certificado = await DocumentoLegal.create({
      documento_legal_tipo: TIPO_GARANTIA,
      documento_legal_url_pdf: `/uploads/garantias/${req.file.filename}`,
      documento_legal_fecha_emision: fechaHoy(),
      documento_legal_fecha_vencimiento: fecha_vencimiento,
      documento_legal_estado: 'Vigente',
      proyecto_codigo_correlativo: equipo.proyecto_codigo_correlativo,
      equipo_hvac_numero_serie: numero_serie
    });

    await audit(`Certificado de garantía cargado para el equipo ${numero_serie}`, 'DOCUMENTO_LEGAL', req.user.rut);

    return res.status(201).json({ success: true, data: certificado, mensaje: 'Certificado de garantía cargado correctamente' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al cargar el certificado de garantía' });
  }
}

// CU43 - Buscador de garantías (paso 2/3/4 de la ficha)
async function buscarGarantias(req, res) {
  try {
    const { proyecto, modelo, numero_serie } = req.query;
    const where = {};
    if (proyecto && String(proyecto).trim()) where.proyecto_codigo_correlativo = String(proyecto).trim();
    if (numero_serie && String(numero_serie).trim()) {
      where.equipo_hvac_numero_serie = { [Op.like]: `%${String(numero_serie).trim()}%` };
    }

    const includeModelo = { model: ModeloHvac, attributes: ['modelo_hvac_id', 'modelo_hvac_nombre'] };
    if (modelo && String(modelo).trim()) {
      includeModelo.where = { modelo_hvac_nombre: { [Op.like]: `%${String(modelo).trim()}%` } };
    }

    const equipos = await EquipoHVAC.findAll({
      where,
      include: [
        includeModelo,
        { model: Proyecto, attributes: ['proyecto_nombre_obra'] }
      ],
      order: [['equipo_hvac_numero_serie', 'ASC']]
    });

    const hoy = fechaHoy();
    const resultado = await Promise.all(equipos.map(async eq => {
      const certificado = await DocumentoLegal.findOne({
        where: { equipo_hvac_numero_serie: eq.equipo_hvac_numero_serie, documento_legal_tipo: TIPO_GARANTIA }
      });

      let garantia = null;
      if (certificado) {
        // Excepción 2 - Garantía vencida
        const vigente = certificado.documento_legal_fecha_vencimiento >= hoy;
        garantia = {
          fecha_vencimiento: certificado.documento_legal_fecha_vencimiento,
          vigente
        };
      }
      // garantia === null es la Excepción 1 (garantía inexistente)

      return {
        equipo_hvac_numero_serie: eq.equipo_hvac_numero_serie,
        equipo_hvac_fecha_instalacion: eq.equipo_hvac_fecha_instalacion,
        proyecto_codigo_correlativo: eq.proyecto_codigo_correlativo,
        proyecto_nombre_obra: eq.Proyecto?.proyecto_nombre_obra || '',
        modelo_hvac_nombre: eq.ModeloHvac?.modelo_hvac_nombre || '',
        garantia
      };
    }));

    return res.json({ success: true, data: resultado });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al buscar garantías' });
  }
}

// CU43 - Pasos 5 y 6: verificar disponibilidad, auditar y entregar la descarga
async function descargarGarantia(req, res) {
  try {
    const { numero_serie } = req.params;

    const certificado = await DocumentoLegal.findOne({
      where: { equipo_hvac_numero_serie: numero_serie, documento_legal_tipo: TIPO_GARANTIA }
    });

    // Excepción 1 - Garantía inexistente
    if (!certificado) {
      return res.status(404).json({ success: false, error: 'El equipo seleccionado no cuenta con un certificado cargado' });
    }

    const rutaFisica = path.join(__dirname, '..', certificado.documento_legal_url_pdf);
    if (!fs.existsSync(rutaFisica)) {
      return res.status(404).json({ success: false, error: 'El archivo no está disponible en el repositorio digital' });
    }

    await audit(`Certificado de garantía descargado para el equipo ${numero_serie}`, 'DOCUMENTO_LEGAL', req.user.rut);

    return res.json({ success: true, data: { url: certificado.documento_legal_url_pdf } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al preparar la descarga del certificado' });
  }
}

module.exports = { upload, cargarGarantia, buscarGarantias, descargarGarantia };
