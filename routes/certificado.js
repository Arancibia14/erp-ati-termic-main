const express = require('express');
const router = express.Router();
const { generarCertificado } = require('../controllers/certificadoController');
const { verifyToken } = require('../middleware/auth');

// CU56 - Emitiendo Certificado de Instalación Técnica
router.post('/', verifyToken, generarCertificado);

module.exports = router;
