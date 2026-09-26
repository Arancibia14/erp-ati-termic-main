const express = require('express');
const router = express.Router();
const { getMateriales, getMaterial, crearMaterial, actualizarMaterial, desactivarMaterial } = require('../controllers/materialController');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { verificarEliminacion, eliminarDefinitivo } = require('../controllers/eliminacionController');

router.get('/', verifyToken, getMateriales);
router.get('/:id', verifyToken, getMaterial);
router.post('/', verifyToken, requireAdmin, crearMaterial);
router.put('/:id', verifyToken, requireAdmin, actualizarMaterial);
router.delete('/:id', verifyToken, requireAdmin, desactivarMaterial);

// CU 49 - Validando integridad referencial en eliminaciones
router.get('/:id/dependencias', verifyToken, requireAdmin, verificarEliminacion('material'));
router.delete('/:id/definitivo', verifyToken, requireAdmin, eliminarDefinitivo('material'));

module.exports = router;
