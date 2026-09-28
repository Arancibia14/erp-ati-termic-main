const express = require('express');
const router = express.Router();
const { getProveedores, getEntidadesAsociadas, asociarSubcontratista } = require('../controllers/proyectoController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// CU15 - Asociando Subcontratista a Proyecto (varios por obra, cada uno con su rol).
// El único actor que asocia es el Administrador Total.
router.get('/proveedores', verifyToken, getProveedores);
router.get('/config/:codigo', verifyToken, getEntidadesAsociadas);
router.post('/:codigo/subcontratistas', verifyToken, requireAdmin, asociarSubcontratista);

module.exports = router;
