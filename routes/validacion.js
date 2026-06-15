const express = require('express');
const router = express.Router();
const { getPendientes, validarEvidencia } = require('../controllers/validacionController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// CU17 - Validando Evidencias de Avance
router.get('/pendientes', verifyToken, requireAdmin, getPendientes);
router.patch('/:id/validar', verifyToken, requireAdmin, validarEvidencia);

module.exports = router;
