const express = require('express');
const router = express.Router();
const { getProveedores, crearProveedor, cambiarEstadoProveedor } = require('../controllers/proveedorController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// CU34 - Gestionando catálogo de proveedores.
// El único actor del caso de uso es el Administrador Total.
router.get('/', verifyToken, requireAdmin, getProveedores);
router.post('/', verifyToken, requireAdmin, crearProveedor);
router.put('/:rut/estado', verifyToken, requireAdmin, cambiarEstadoProveedor);

module.exports = router;
