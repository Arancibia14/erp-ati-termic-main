const express = require('express');
const router = express.Router();
const { getOrdenesPendientesFact, vincularFactura, upload } = require('../controllers/facturaController');
const { verifyToken } = require('../middleware/auth');

// CU37 - Vinculando Facturas Digitales a Procesos de Compra
router.get('/ordenes-pendientes', verifyToken, getOrdenesPendientesFact);
router.post('/:id/vincular', verifyToken, upload.single('pdf'), vincularFactura);

module.exports = router;
