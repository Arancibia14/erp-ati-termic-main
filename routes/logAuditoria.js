const express = require('express');
const router = express.Router();
const { getLogs, getModulos, getDetalle } = require('../controllers/logAuditoriaController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// CU04 - Visualizando registros de auditoría (solo Administrador Total)
router.get('/', verifyToken, requireAdmin, getLogs);
router.get('/modulos', verifyToken, requireAdmin, getModulos);
router.get('/:id', verifyToken, requireAdmin, getDetalle);

module.exports = router;
