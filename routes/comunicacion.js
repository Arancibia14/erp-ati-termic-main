const express = require('express');
const router = express.Router();
const { getHistorialComunicaciones, registrarComunicacion, upload } = require('../controllers/comunicacionController');
const { verifyToken } = require('../middleware/auth');

// CU44 - Registrando Comunicación del Proyecto
router.get('/:codigo/historial', verifyToken, getHistorialComunicaciones);
router.post('/', verifyToken, upload.single('adjunto'), registrarComunicacion);

module.exports = router;
