const express = require('express');
const router = express.Router();
const { getProveedores, getEntidadesAsociadas, vincularProveedor } = require('../controllers/proyectoController');
const { verifyToken } = require('../middleware/auth');

// CU15 - Asociando Subcontratista a Proyecto
router.get('/proveedores', verifyToken, getProveedores);
router.get('/config/:codigo', verifyToken, getEntidadesAsociadas);
router.put('/:codigo/proveedor', verifyToken, vincularProveedor);

module.exports = router;
