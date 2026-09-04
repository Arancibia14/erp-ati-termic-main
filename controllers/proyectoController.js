const sequelize = require('../config/database');
const Proyecto = require('../models/Proyecto');
const Proveedor = require('../models/Proveedor');
const EstadoProyecto = require('../models/EstadoProyecto');
const LogAuditoria = require('../models/LogAuditoria');

async function getProveedores(req, res) {
  try {
    const proveedores = await Proveedor.findAll();
    return res.json({ success: true, data: proveedores });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener proveedores' });
  }
}

async function getEntidadesAsociadas(req, res) {
  try {
    const { codigo } = req.params;
    const proyecto = await Proyecto.findByPk(codigo, {
      include: [{ model: EstadoProyecto, attributes: ['estado_proyecto_nombre'] }]
    });
    if (!proyecto) {
      return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    }

    const [proveedor] = await sequelize.query(
      'SELECT p.* FROM PROVEEDOR p INNER JOIN PROYECTO pr ON pr.proveedor_rut = p.proveedor_rut WHERE pr.proyecto_codigo_correlativo = :codigo',
      { replacements: { codigo }, type: sequelize.QueryTypes.SELECT }
    );

    return res.json({ success: true, data: { proyecto, proveedor: proveedor || null } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener entidades del proyecto' });
  }
}

async function vincularProveedor(req, res) {
  try {
    const { codigo } = req.params;
    const { proveedor_rut } = req.body;

    if (!proveedor_rut) {
      return res.status(400).json({ success: false, error: 'RUT del proveedor es requerido' });
    }

    const proyecto = await Proyecto.findByPk(codigo);
    if (!proyecto) {
      return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    }

    const proveedor = await Proveedor.findByPk(proveedor_rut);
    if (!proveedor) {
      return res.status(404).json({ success: false, error: 'Proveedor no encontrado' });
    }

    await sequelize.query(
      'UPDATE PROYECTO SET proveedor_rut = :proveedor_rut WHERE proyecto_codigo_correlativo = :codigo',
      { replacements: { proveedor_rut, codigo } }
    );

    await LogAuditoria.create({
      log_auditoria_fecha_hora: new Date(),
      log_auditoria_accion: `Proveedor ${proveedor_rut} vinculado al proyecto ${codigo}`,
      log_auditoria_modulo: 'PROYECTO',
      usuario_rut: req.user.rut
    });

    return res.json({ success: true, data: { proyecto_codigo: codigo, proveedor_rut } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al vincular proveedor' });
  }
}

module.exports = { getProveedores, getEntidadesAsociadas, vincularProveedor };
