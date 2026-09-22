const express = require('express');
const router = express.Router();
const { getUbicacion, buscarDireccion, guardarUbicacion } = require('../controllers/ubicacionController');
const { verifyToken } = require('../middleware/auth');

// CU10 - Registrando geolocalización de la obra.
// Sin requireAdmin: el caso de uso incluye al Supervisor de Obra.
router.get('/:codigo', verifyToken, getUbicacion);
router.post('/buscar', verifyToken, buscarDireccion);
router.put('/:codigo', verifyToken, guardarUbicacion);

module.exports = router;
