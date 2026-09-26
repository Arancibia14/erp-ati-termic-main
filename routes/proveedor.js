const express = require('express');
const router = express.Router();
const { getProveedores, crearProveedor, cambiarEstadoProveedor } = require('../controllers/proveedorController');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { verificarEliminacion, eliminarDefinitivo } = require('../controllers/eliminacionController');

// CU34 - Gestionando catálogo de proveedores.
// El único actor del caso de uso es el Administrador Total.
router.get('/', verifyToken, requireAdmin, getProveedores);
router.post('/', verifyToken, requireAdmin, crearProveedor);
router.put('/:rut/estado', verifyToken, requireAdmin, cambiarEstadoProveedor);

// CU 49 - Validando integridad referencial en eliminaciones
router.get('/:id/dependencias', verifyToken, requireAdmin, verificarEliminacion('proveedor'));
router.delete('/:id/definitivo', verifyToken, requireAdmin, eliminarDefinitivo('proveedor'));

module.exports = router;
