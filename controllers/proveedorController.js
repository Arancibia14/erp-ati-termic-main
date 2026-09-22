// CU34 - Gestionando catálogo de proveedores.
// Solo el Administrador Total, que es el único actor del caso de uso.
const Proveedor = require('../models/Proveedor');
const LogAuditoria = require('../models/LogAuditoria');
const { validarRutChileno } = require('../utils/rut');

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

// CU34 paso 2 - Listado del catálogo. Los activos primero, alfabéticamente.
async function getProveedores(req, res) {
  try {
    const proveedores = await Proveedor.findAll({
      order: [['proveedor_activo', 'DESC'], ['proveedor_razon_social', 'ASC']]
    });
    return res.json({ success: true, data: proveedores });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener el catálogo de proveedores' });
  }
}

// CU34 pasos 4 a 9 - Registrar un proveedor
async function crearProveedor(req, res) {
  try {
    const { proveedor_rut, proveedor_razon_social, proveedor_correo, proveedor_telefono } = req.body;

    // CU34 Excepción 3 - Datos incompletos
    const faltantes = [];
    if (!proveedor_rut || !String(proveedor_rut).trim()) faltantes.push('proveedor_rut');
    if (!proveedor_razon_social || !String(proveedor_razon_social).trim()) faltantes.push('proveedor_razon_social');
    if (faltantes.length) {
      return res.status(400).json({ success: false, error: 'El RUT y la razón social son obligatorios', campos: faltantes });
    }

    // CU34 Excepción 1 - RUT inválido
    const validacion = validarRutChileno(proveedor_rut);
    if (!validacion.valido) {
      return res.status(400).json({ success: false, error: validacion.error, campos: ['proveedor_rut'] });
    }
    const rut = validacion.rut;

    // El correo es opcional, pero si viene debe tener forma de correo
    const correo = proveedor_correo && String(proveedor_correo).trim();
    if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      return res.status(400).json({ success: false, error: 'El correo de contacto no tiene un formato válido', campos: ['proveedor_correo'] });
    }

    // CU34 Excepción 2 - RUT duplicado
    const existe = await Proveedor.findByPk(rut);
    if (existe) {
      return res.status(400).json({
        success: false,
        error: `El RUT ${rut} ya pertenece al proveedor "${existe.proveedor_razon_social}"`,
        campos: ['proveedor_rut']
      });
    }

    const proveedor = await Proveedor.create({
      proveedor_rut: rut,
      proveedor_razon_social: String(proveedor_razon_social).trim(),
      proveedor_correo: correo || null,
      proveedor_telefono: (proveedor_telefono && String(proveedor_telefono).trim()) || null,
      proveedor_activo: true
    });

    await audit(`Proveedor ${rut} registrado en el catálogo`, 'PROVEEDOR', req.user.rut);
    return res.status(201).json({ success: true, data: proveedor, mensaje: 'Proveedor registrado exitosamente' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al registrar el proveedor' });
  }
}

// CU34 paso 10 - Desactivar o reactivar un proveedor del catálogo
async function cambiarEstadoProveedor(req, res) {
  try {
    const { rut } = req.params;
    const { activo } = req.body;
    if (typeof activo !== 'boolean') {
      return res.status(400).json({ success: false, error: 'Indica si el proveedor queda activo o inactivo' });
    }

    const proveedor = await Proveedor.findByPk(rut);
    if (!proveedor) return res.status(404).json({ success: false, error: 'Proveedor no encontrado' });

    if (proveedor.proveedor_activo === activo) {
      return res.status(400).json({
        success: false,
        error: `El proveedor ya está ${activo ? 'activo' : 'inactivo'}`
      });
    }

    await proveedor.update({ proveedor_activo: activo });
    await audit(`Proveedor ${rut} ${activo ? 'reactivado' : 'desactivado'} en el catálogo`, 'PROVEEDOR', req.user.rut);
    return res.json({
      success: true,
      data: proveedor,
      mensaje: activo
        ? `Proveedor "${proveedor.proveedor_razon_social}" reactivado: vuelve a estar disponible`
        : `Proveedor "${proveedor.proveedor_razon_social}" desactivado: deja de aparecer al asignar materiales o registrar guías`
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al cambiar el estado del proveedor' });
  }
}

module.exports = { getProveedores, crearProveedor, cambiarEstadoProveedor };
