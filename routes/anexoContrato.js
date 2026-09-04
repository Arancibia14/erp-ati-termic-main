const express = require('express');
const router = express.Router();
const { getInfoContractual, generarAnexoTraslado } = require('../controllers/anexoContratoController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// CU21 - Generando Anexo de Contrato por Traslado
router.get('/trabajador/:rut', verifyToken, requireAdmin, getInfoContractual);
router.post('/', verifyToken, requireAdmin, generarAnexoTraslado);

module.exports = router;
