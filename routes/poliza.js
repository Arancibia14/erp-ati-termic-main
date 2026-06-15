const express = require('express');
const router = express.Router();
const { subirPoliza, upload } = require('../controllers/polizaController');
const { verifyToken } = require('../middleware/auth');

// CU55 - Gestionando Pólizas de Seguros por Faena
router.post('/', verifyToken, upload.single('pdf'), subirPoliza);

module.exports = router;
