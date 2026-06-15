const express = require('express');
const router = express.Router();
const { getHitosPorProyecto, subirEvidencia, upload } = require('../controllers/evidenciaController');
const { verifyToken } = require('../middleware/auth');

// CU16 - Cargando Evidencias Fotográficas de Avance
router.get('/hito/:codigo', verifyToken, getHitosPorProyecto);
router.post('/', verifyToken, upload.single('foto'), subirEvidencia);

module.exports = router;
