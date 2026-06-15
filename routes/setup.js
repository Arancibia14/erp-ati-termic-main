const express = require('express');
const router = express.Router();
const {
  getEstados, getEspecialidades, getProyectos, getTrabajadores, getOrdenes,
  crearProyecto, crearProveedor, crearTrabajador, crearHito, crearSolicitudMaterial,
  crearGuiaDespacho, crearContratoLaboral, actualizarCoordenadasProyecto
} = require('../controllers/setupController');
const { verifyToken } = require('../middleware/auth');

router.get('/estados',           verifyToken, getEstados);
router.get('/especialidades',    verifyToken, getEspecialidades);
router.get('/proyectos',         verifyToken, getProyectos);
router.get('/trabajadores',      verifyToken, getTrabajadores);
router.get('/ordenes',           verifyToken, getOrdenes);
router.post('/proyecto',         verifyToken, crearProyecto);
router.post('/proveedor',        verifyToken, crearProveedor);
router.post('/trabajador',       verifyToken, crearTrabajador);
router.post('/hito',             verifyToken, crearHito);
router.post('/solicitud-material', verifyToken, crearSolicitudMaterial);
router.post('/guia-despacho',    verifyToken, crearGuiaDespacho);
router.post('/contrato',         verifyToken, crearContratoLaboral);
router.put('/proyecto/:codigo/coordenadas', verifyToken, actualizarCoordenadasProyecto);

module.exports = router;
