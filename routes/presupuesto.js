const express = require('express');
const router = express.Router();
const { getPresupuestoActual, registrarCambioPpto } = require('../controllers/presupuestoController');
const { verifyToken } = require('../middleware/auth');

// CU54 - Registrando Control de Cambios Presupuestarios
router.get('/:codigo', verifyToken, getPresupuestoActual);
router.post('/:codigo/cambio', verifyToken, registrarCambioPpto);

module.exports = router;
