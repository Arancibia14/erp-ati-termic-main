const PlantillaCorreo = require('../models/PlantillaCorreo');
const LogAuditoria = require('../models/LogAuditoria');
const { EVENTOS_CORREO, etiquetasDe, extraerEtiquetas, htmlBalanceado } = require('../utils/plantillaCorreo');

// CU48 - Lista de eventos de correo disponibles para editar
async function getEventos(req, res) {
  try {
    const filas = await PlantillaCorreo.findAll();
    const data = EVENTOS_CORREO.map(ev => {
      const fila = filas.find(f => f.plantilla_correo_evento === ev.evento);
      return {
        evento: ev.evento,
        nombre: ev.nombre,
        etiquetas: ev.etiquetas,
        fecha_actualizacion: fila ? fila.plantilla_correo_fecha_actualizacion : null
      };
    });
    return res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener los eventos de correo' });
  }
}

// CU48 Paso 2 - Contenido actual de la plantilla de un evento
async function getPlantilla(req, res) {
  try {
    const { evento } = req.params;
    const def = EVENTOS_CORREO.find(e => e.evento === evento);
    if (!def) return res.status(404).json({ success: false, error: 'El evento de correo indicado no existe' });

    const fila = await PlantillaCorreo.findByPk(evento);
    if (!fila) return res.status(404).json({ success: false, error: 'La plantilla no está registrada' });

    return res.json({
      success: true,
      data: {
        evento,
        nombre: def.nombre,
        etiquetas: def.etiquetas,
        asunto: fila.plantilla_correo_asunto,
        contenido_html: fila.plantilla_correo_contenido_html,
        contenido_texto: fila.plantilla_correo_contenido_texto,
        fecha_actualizacion: fila.plantilla_correo_fecha_actualizacion
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener la plantilla' });
  }
}

// CU48 Pasos 3-6 - Guardar la plantilla editada
async function actualizarPlantilla(req, res) {
  try {
    const { evento } = req.params;
    const def = EVENTOS_CORREO.find(e => e.evento === evento);
    if (!def) return res.status(404).json({ success: false, error: 'El evento de correo indicado no existe' });

    const { asunto, contenido_html, contenido_texto } = req.body;
    const faltantes = [];
    if (!asunto || !String(asunto).trim()) faltantes.push('asunto');
    if (!contenido_html || !String(contenido_html).trim()) faltantes.push('contenido_html');
    if (faltantes.length) {
      return res.status(400).json({ success: false, error: 'Completa el asunto y el contenido de la plantilla', campos: faltantes });
    }

    // Excepción 1 - Etiquetas inválidas para este tipo de correo
    const permitidas = etiquetasDe(evento);
    const usadas = new Set([
      ...extraerEtiquetas(asunto),
      ...extraerEtiquetas(contenido_html),
      ...extraerEtiquetas(contenido_texto || '')
    ]);
    const invalidas = Array.from(usadas).filter(e => !permitidas.includes(e));
    if (invalidas.length) {
      return res.status(400).json({
        success: false,
        error: `La plantilla usa una etiqueta que no existe para este tipo de correo: {{${invalidas[0]}}}`,
        campos: ['contenido_html']
      });
    }

    // Paso 6 - El sistema valida que el formato HTML sea correcto
    if (!htmlBalanceado(contenido_html)) {
      return res.status(400).json({
        success: false,
        error: 'El HTML ingresado no es válido: revisa que todas las etiquetas estén bien cerradas',
        campos: ['contenido_html']
      });
    }

    const fila = await PlantillaCorreo.findByPk(evento);
    if (!fila) return res.status(404).json({ success: false, error: 'La plantilla no está registrada' });

    await fila.update({
      plantilla_correo_asunto: String(asunto).trim(),
      plantilla_correo_contenido_html: contenido_html,
      plantilla_correo_contenido_texto: contenido_texto || null,
      plantilla_correo_fecha_actualizacion: new Date(),
      usuario_rut: req.user.rut
    });

    try {
      await LogAuditoria.create({
        log_auditoria_fecha_hora: new Date(),
        log_auditoria_accion: `Plantilla de correo "${def.nombre}" actualizada`,
        log_auditoria_modulo: 'PLANTILLA_CORREO',
        usuario_rut: req.user.rut
      });
    } catch (_) { /* no bloquear la operación principal */ }

    return res.json({ success: true, mensaje: 'Plantilla actualizada correctamente', data: { evento } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al actualizar la plantilla' });
  }
}

module.exports = { getEventos, getPlantilla, actualizarPlantilla };
