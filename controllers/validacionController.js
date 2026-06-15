const HitoTecnico = require('../models/HitoTecnico');
const EvidenciaFotografica = require('../models/EvidenciaFotografica');
const LogAuditoria = require('../models/LogAuditoria');

// CU17 - C_Validacion: Validando Evidencias de Avance

// Retorna todas las evidencias fotográficas que esperan aprobación del administrador
async function getPendientes(req, res) {
  try {
    const evidencias = await EvidenciaFotografica.findAll({
      where: { evidencia_fotografica_estado_aprobacion: 'pendiente' },
      include: [{ model: HitoTecnico, attributes: ['hito_tecnico_nombre_hito', 'proyecto_codigo_correlativo'] }],
      order: [['evidencia_fotografica_fecha_captura', 'DESC']]
    });
    return res.json({ success: true, data: evidencias });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener evidencias pendientes' });
  }
}

// Cambia el estado de una evidencia a: 'aprobado', 'rechazado' o 're_captura'
// Si se rechaza, el motivo es obligatorio para notificar al supervisor
async function validarEvidencia(req, res) {
  try {
    const { id } = req.params;
    const { estado, comentario } = req.body;

    if (!['aprobado', 'rechazado', 're_captura'].includes(estado)) {
      return res.status(400).json({ success: false, error: 'Estado debe ser "aprobado", "rechazado" o "re_captura"' });
    }

    if (estado === 'rechazado' && !comentario?.trim()) {
      return res.status(400).json({ success: false, error: 'El motivo de rechazo es requerido' });
    }

    const evidencia = await EvidenciaFotografica.findByPk(id);
    if (!evidencia) {
      return res.status(404).json({ success: false, error: 'Evidencia no encontrada' });
    }

    await evidencia.update({
      evidencia_fotografica_estado_aprobacion: estado
    });

    await LogAuditoria.create({
      log_auditoria_fecha_hora: new Date(),
      log_auditoria_accion: `Evidencia #${id} ${estado}${comentario ? ': ' + comentario.substring(0, 80) : ''}`,
      log_auditoria_modulo: 'EVIDENCIA',
      usuario_rut: req.user.rut
    });

    return res.json({ success: true, data: { id, estado } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al validar evidencia' });
  }
}

module.exports = { getPendientes, validarEvidencia };
