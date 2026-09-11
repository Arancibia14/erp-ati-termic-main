const express = require('express');
const router = express.Router();
const {
  getEstados, getEspecialidades, getProyectos, getTrabajadores, getOrdenes, getContratos,
  crearProyecto, crearProveedor, crearTrabajador, crearHito, crearSolicitudMaterial,
  crearGuiaDespacho, crearContratoLaboral, actualizarContratoLaboral, eliminarContratoLaboral,
  actualizarCoordenadasProyecto
} = require('../controllers/setupController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/estados',           verifyToken, getEstados);
router.get('/especialidades',    verifyToken, getEspecialidades);
router.get('/proyectos',         verifyToken, getProyectos);
router.get('/trabajadores',      verifyToken, getTrabajadores);
router.get('/ordenes',           verifyToken, getOrdenes);
// Los contratos incluyen sueldos: solo el administrador los gestiona
router.get('/contratos',         verifyToken, requireAdmin, getContratos);
router.post('/proyecto',         verifyToken, crearProyecto);
router.post('/proveedor',        verifyToken, crearProveedor);
router.post('/trabajador',       verifyToken, crearTrabajador);
router.post('/hito',             verifyToken, crearHito);
router.post('/solicitud-material', verifyToken, crearSolicitudMaterial);
router.post('/guia-despacho',    verifyToken, crearGuiaDespacho);
router.post('/contrato',         verifyToken, requireAdmin, crearContratoLaboral);
router.put('/proyecto/:codigo/coordenadas', verifyToken, actualizarCoordenadasProyecto);
router.put('/contrato/:id',      verifyToken, requireAdmin, actualizarContratoLaboral);
router.delete('/contrato/:id',   verifyToken, requireAdmin, eliminarContratoLaboral);

module.exports = router;
