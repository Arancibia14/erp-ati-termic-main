const express = require('express');
const router = express.Router();
const { getGuiasPendientes, confirmarRecepcion } = require('../controllers/recepcionController');
const { verifyToken } = require('../middleware/auth');

// CU58 - Registrando Recepción de Insumos en Obra
router.get('/guias-pendientes', verifyToken, getGuiasPendientes);
router.post('/:id/confirmar', verifyToken, confirmarRecepcion);

module.exports = router;
