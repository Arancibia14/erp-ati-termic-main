const express = require('express');
const router = express.Router();
const { buscarDocumentos } = require('../controllers/sistema/documentoController');
const { verifyToken } = require('../middleware/auth');

// CU47 - Buscando Documentos Legales
router.get('/buscar', verifyToken, buscarDocumentos);

module.exports = router;
