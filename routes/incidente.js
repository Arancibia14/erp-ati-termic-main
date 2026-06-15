const express = require('express');
const router = express.Router();
const { getProyectos, getTrabajadores, registrarIncidente, upload } = require('../controllers/incidenteController');
const { verifyToken } = require('../middleware/auth');

// CU57 - Registrando Incidentes de Seguridad y Salud Ocupacional
router.get('/proyectos', verifyToken, getProyectos);
router.get('/trabajadores/:codigo', verifyToken, getTrabajadores);
router.post('/incidente', verifyToken, upload.array('fotos', 10), registrarIncidente);

module.exports = router;
