// CU 49 - Validando integridad referencial en eliminaciones.
// Sirve a los tres registros maestros (Trabajador, Material y Proveedor).
// Solo el Administrador Total, que es el único actor del caso de uso.
const sequelize = require('../config/database');
const LogAuditoria = require('../models/LogAuditoria');
const { MAESTROS, buscarMaestro, rastrearDependencias, mensajeBloqueo } = require('../utils/integridadReferencial');

const NO_DISPONIBLE = 'El registro ya no existe: pudo haber sido eliminado por otro usuario';

class Bloqueo extends Error {
  constructor(status, mensaje, dependencias = []) {
    super(mensaje);
    this.status = status;
    this.dependencias = dependencias;
  }
}

// CU 49 pasos 2 a 4 - Antes de pedir la confirmación, el sistema suspende la
// orden de borrado y rastrea el registro en todas las tablas relacionadas.
const verificarEliminacion = tipo => async (req, res) => {
  try {
    const registro = await buscarMaestro(tipo, req.params.id);
    if (!registro) return res.status(404).json({ success: false, error: NO_DISPONIBLE });

    const dependencias = await rastrearDependencias(tipo, registro);
    return res.json({
      success: true,
      data: {
        eliminable: dependencias.length === 0,
        nombre: MAESTROS[tipo].nombre(registro),
        dependencias,
        mensaje: dependencias.length ? mensajeBloqueo(tipo, registro, dependencias) : null
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al revisar los registros asociados' });
  }
};

// CU 49 pasos 5 y 6 - Tras la confirmación final se vuelve a rastrear dentro
// de la transacción, con el registro bloqueado, por si otro usuario le asoció
// un documento entre la revisión y la confirmación.
const eliminarDefinitivo = tipo => async (req, res) => {
  const { modelo, modulo, nombre } = MAESTROS[tipo];
  let eliminado;
  try {
    await sequelize.transaction(async t => {
      const registro = await buscarMaestro(tipo, req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
      if (!registro) throw new Bloqueo(404, NO_DISPONIBLE);

      const dependencias = await rastrearDependencias(tipo, registro, t);
      if (dependencias.length) throw new Bloqueo(409, mensajeBloqueo(tipo, registro, dependencias), dependencias);

      eliminado = { id: registro.get(modelo.primaryKeyAttribute), nombre: nombre(registro) };
      await registro.destroy({ transaction: t });
    });
  } catch (err) {
    if (err instanceof Bloqueo) {
      return res.status(err.status).json({ success: false, error: err.message, codigo: err.status === 409 ? 'DEPENDENCIAS' : undefined, dependencias: err.dependencias });
    }
    // Respaldo: si una clave foránea de la base detecta un vínculo que el
    // rastreo no cubrió, se informa igual como restricción y no como error.
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(409).json({
        success: false,
        codigo: 'DEPENDENCIAS',
        error: `No se puede eliminar ${MAESTROS[tipo].articulo} porque tiene registros asociados en el sistema. Puedes desactivarlo en su lugar.`,
        dependencias: []
      });
    }
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al eliminar el registro' });
  }

  try {
    await LogAuditoria.create({
      log_auditoria_fecha_hora: new Date(),
      log_auditoria_accion: `Eliminación definitiva de ${MAESTROS[tipo].articulo.replace(/^el /, '')} ${eliminado.id} (${eliminado.nombre}) tras validar que no tenía registros asociados`,
      log_auditoria_modulo: modulo,
      usuario_rut: req.user.rut
    });
  } catch (_) { /* no bloquear la operación principal */ }

  return res.json({ success: true, mensaje: 'Registro eliminado exitosamente', data: eliminado });
};

module.exports = { verificarEliminacion, eliminarDefinitivo };
