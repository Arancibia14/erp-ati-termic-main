const express = require('express');
const router = express.Router();
const {
  getProveedores,
  getSolicitudesPendientes,
  generarOrdenCompra,
  getHistorial,
  getDetalle
} = require('../controllers/ordenCompraController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// CU35 - Generando Orden de Compra Automáticamente
router.get('/proveedores', verifyToken, requireAdmin, getProveedores);
router.get('/solicitudes-pendientes', verifyToken, requireAdmin, getSolicitudesPendientes);
router.post('/generar', verifyToken, requireAdmin, generarOrdenCompra);

// CU36 - Almacenando historial de Órdenes de Compra
router.get('/historial', verifyToken, requireAdmin, getHistorial);
router.get('/:id/detalle', verifyToken, requireAdmin, getDetalle);

module.exports = router;
