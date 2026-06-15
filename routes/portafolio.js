const express = require('express');
const router = express.Router();
const { getListadoProyectos, getProyecto, actualizarProyecto, upload } = require('../controllers/portafolioController');
const { verifyToken } = require('../middleware/auth');

// CU45 - Gestionando Portafolio de Obras
router.get('/', verifyToken, getListadoProyectos);
router.get('/:codigo', verifyToken, getProyecto);
router.put('/:codigo', verifyToken, upload.array('imagenes', 10), actualizarProyecto);

module.exports = router;
