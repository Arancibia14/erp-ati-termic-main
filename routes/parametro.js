const express = require('express');
const router = express.Router();
const { getTributarios, actualizarTributarios } = require('../controllers/parametroController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// CU52 - Configurando parámetros de IVA y retenciones (solo Administrador Total)
router.get('/tributarios', verifyToken, requireAdmin, getTributarios);
router.put('/tributarios', verifyToken, requireAdmin, actualizarTributarios);

module.exports = router;
