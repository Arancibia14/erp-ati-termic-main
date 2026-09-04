const express = require('express');
const router = express.Router();
const { getHitosPorProyecto, subirEvidencia, getPendientes, validarEvidencia, upload } = require('../controllers/evidenciaController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/hito/:codigo', verifyToken, getHitosPorProyecto);
router.post('/', verifyToken, upload.single('foto'), subirEvidencia);
router.get('/pendientes', verifyToken, requireAdmin, getPendientes);
router.patch('/:id/validar', verifyToken, requireAdmin, validarEvidencia);

module.exports = router;
