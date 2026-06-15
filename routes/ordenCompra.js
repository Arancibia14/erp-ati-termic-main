const express = require('express');
const router = express.Router();
const { getProveedores, getSolicitudesPendientes, generarOrdenCompra } = require('../controllers/ordenCompraController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// CU35 - Generando Orden de Compra Automáticamente
router.get('/proveedores', verifyToken, requireAdmin, getProveedores);
router.get('/solicitudes-pendientes', verifyToken, requireAdmin, getSolicitudesPendientes);
router.post('/generar', verifyToken, requireAdmin, generarOrdenCompra);

module.exports = router;
