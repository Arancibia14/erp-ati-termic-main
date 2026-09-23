const express = require('express');
const router = express.Router();
const { getListadoProyectos, getProyecto, actualizarProyecto, detenerProyecto, actualizarEstadoProyecto, upload } = require('../controllers/portafolioController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// CU45 - Gestionando Portafolio de Obras
router.get('/', verifyToken, getListadoProyectos);
router.get('/:codigo', verifyToken, getProyecto);
router.put('/:codigo', verifyToken, upload.array('imagenes', 10), actualizarProyecto);

// CU12 - Registrando detención de proyecto (Administrador Total y Supervisor de Obra)
router.put('/:codigo/detener', verifyToken, detenerProyecto);

// CU11 - Actualizando estado del proyecto (solo Administrador Total)
router.put('/:codigo/estado', verifyToken, requireAdmin, actualizarEstadoProyecto);

module.exports = router;
