const express = require('express');
const router = express.Router();
const { getPlanificacion, crearHito } = require('../controllers/hitoController');
const { verifyToken } = require('../middleware/auth');

// CU09 - Definiendo hitos técnicos del proyecto.
// Sin requireAdmin: el caso de uso incluye al Supervisor de Obra.
router.get('/:codigo', verifyToken, getPlanificacion);
router.post('/', verifyToken, crearHito);

module.exports = router;
