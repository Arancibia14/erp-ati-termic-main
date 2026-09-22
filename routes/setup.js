const express = require('express');
const router = express.Router();
const {
  getEstados, getEspecialidades, getProyectos, getTrabajadores, getOrdenes, getContratos,
  crearProyecto, crearProveedor, crearTrabajador, crearSolicitudMaterial,
  crearGuiaDespacho, crearContratoLaboral, actualizarContratoLaboral, eliminarContratoLaboral,
  actualizarCoordenadasProyecto, actualizarPlazoProyecto, actualizarCajaChicaProyecto
} = require('../controllers/setupController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/estados',           verifyToken, getEstados);
router.get('/especialidades',    verifyToken, getEspecialidades);
router.get('/proyectos',         verifyToken, getProyectos);
router.get('/trabajadores',      verifyToken, getTrabajadores);
router.get('/ordenes',           verifyToken, getOrdenes);
// Los contratos incluyen sueldos: solo el administrador los gestiona
router.get('/contratos',         verifyToken, requireAdmin, getContratos);
// Altas de datos base: solo las usa Configuración, que es exclusiva del administrador
router.post('/proyecto',         verifyToken, requireAdmin, crearProyecto);
router.post('/proveedor',        verifyToken, requireAdmin, crearProveedor);
router.post('/trabajador',       verifyToken, requireAdmin, crearTrabajador);
router.post('/solicitud-material', verifyToken, requireAdmin, crearSolicitudMaterial);
router.post('/guia-despacho',    verifyToken, requireAdmin, crearGuiaDespacho);
router.post('/contrato',         verifyToken, requireAdmin, crearContratoLaboral);
router.put('/proyecto/:codigo/coordenadas', verifyToken, requireAdmin, actualizarCoordenadasProyecto);
router.put('/proyecto/:codigo/plazo', verifyToken, requireAdmin, actualizarPlazoProyecto);
router.put('/proyecto/:codigo/caja-chica', verifyToken, requireAdmin, actualizarCajaChicaProyecto);
router.put('/contrato/:id',      verifyToken, requireAdmin, actualizarContratoLaboral);
router.delete('/contrato/:id',   verifyToken, requireAdmin, eliminarContratoLaboral);

module.exports = router;
