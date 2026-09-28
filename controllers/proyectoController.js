const Proyecto = require('../models/Proyecto');
const Proveedor = require('../models/Proveedor');
const EstadoProyecto = require('../models/EstadoProyecto');
const ProyectoSubcontratista = require('../models/ProyectoSubcontratista');
const LogAuditoria = require('../models/LogAuditoria');
const { fechaHoy } = require('../utils/fecha');

const ROL_MAXIMO = 150;

async function getProveedores(req, res) {
  try {
    // CU34 paso 10 - Los proveedores dados de baja no se ofrecen
    const proveedores = await Proveedor.findAll({ where: { proveedor_activo: true } });
    return res.json({ success: true, data: proveedores });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener proveedores' });
  }
}

// CU15 paso 2 - Subcontratistas asociados actualmente a la obra, con su rol
async function getEntidadesAsociadas(req, res) {
  try {
    const { codigo } = req.params;
    const proyecto = await Proyecto.findByPk(codigo, {
      include: [{ model: EstadoProyecto, attributes: ['estado_proyecto_nombre'] }]
    });
    if (!proyecto) {
      return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    }

    const vinculos = await ProyectoSubcontratista.findAll({
      where: { proyecto_codigo_correlativo: codigo },
      include: [{ model: Proveedor, attributes: ['proveedor_razon_social', 'proveedor_correo', 'proveedor_telefono'] }],
      order: [['proyecto_subcontratista_fecha', 'ASC'], ['proyecto_subcontratista_id', 'ASC']]
    });

    return res.json({ success: true, data: { proyecto, subcontratistas: vinculos } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener entidades del proyecto' });
  }
}

// CU15 - Asociando subcontratista a proyecto: una obra puede tener varios,
// cada uno con el rol que cumple en ella
async function asociarSubcontratista(req, res) {
  try {
    const { codigo } = req.params;
    const proveedorRut = String(req.body.proveedor_rut || '').trim();
    const rol = String(req.body.rol || '').trim();

    const campos = [];
    if (!proveedorRut) campos.push('proveedor_rut');
    if (!rol) campos.push('rol');
    if (campos.length) {
      return res.status(400).json({ success: false, error: 'Selecciona el subcontratista e indica el rol que cumplirá en la obra', campos });
    }
    if (rol.length > ROL_MAXIMO) {
      return res.status(400).json({ success: false, error: `El rol no puede superar los ${ROL_MAXIMO} caracteres`, campos: ['rol'] });
    }

    const proyecto = await Proyecto.findByPk(codigo);
    if (!proyecto) {
      return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    }

    // Excepción 1 - Subcontratista no existe: se crea en el módulo de proveedores
    const proveedor = await Proveedor.findByPk(proveedorRut);
    if (!proveedor || !proveedor.proveedor_activo) {
      return res.status(404).json({ success: false, error: 'El subcontratista no está registrado. Créalo en el módulo de proveedores', campos: ['proveedor_rut'] });
    }

    // Excepción 2 - Vinculación duplicada
    const existente = await ProyectoSubcontratista.findOne({
      where: { proyecto_codigo_correlativo: codigo, proveedor_rut: proveedorRut }
    });
    if (existente) {
      return res.status(409).json({ success: false, error: 'La empresa ya forma parte del proyecto', campos: ['proveedor_rut'] });
    }

    let vinculo;
    try {
      vinculo = await ProyectoSubcontratista.create({
        proyecto_codigo_correlativo: codigo,
        proveedor_rut: proveedorRut,
        proyecto_subcontratista_rol: rol,
        proyecto_subcontratista_fecha: fechaHoy()
      });
    } catch (err) {
      // Dos asociaciones simultáneas de la misma empresa: la llave única rechaza la segunda
      if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ success: false, error: 'La empresa ya forma parte del proyecto', campos: ['proveedor_rut'] });
      }
      throw err;
    }

    try {
      await LogAuditoria.create({
        log_auditoria_fecha_hora: new Date(),
        log_auditoria_accion: `Subcontratista ${proveedorRut} (${proveedor.proveedor_razon_social}) asociado al proyecto ${codigo} con el rol "${rol}"`,
        log_auditoria_modulo: 'PROYECTO',
        usuario_rut: req.user.rut
      });
    } catch (_) { /* no bloquear la operación principal */ }

    return res.status(201).json({ success: true, data: vinculo, mensaje: 'Subcontratista asociado exitosamente' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al asociar el subcontratista' });
  }
}

module.exports = { getProveedores, getEntidadesAsociadas, asociarSubcontratista };
