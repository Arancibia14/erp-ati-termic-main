const express = require('express');
const router = express.Router();
const { subirEspecificacion, getEspecificaciones, cargarEspecificacion } = require('../controllers/especificacionController');
const { verifyToken } = require('../middleware/auth');

// CU13 - Gestionando Especificaciones Técnicas.
// Sin requireAdmin: el caso de uso incluye al Supervisor de Obra.
router.get('/:codigo', verifyToken, getEspecificaciones);
router.post('/:codigo', verifyToken, subirEspecificacion, cargarEspecificacion);

module.exports = router;
