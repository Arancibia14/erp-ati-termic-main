const express = require('express');
const router = express.Router();
const { getProyectos, getTrabajadores, registrarIncidente, upload } = require('../controllers/ssoController');
const { verifyToken } = require('../middleware/auth');

router.get('/proyectos', verifyToken, getProyectos);
router.get('/trabajadores/:codigo', verifyToken, getTrabajadores);
router.post('/incidente', verifyToken, upload.array('fotos', 10), registrarIncidente);

module.exports = router;
