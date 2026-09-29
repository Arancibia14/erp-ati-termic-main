const express = require('express');
const router = express.Router();
const { getMateriales, getMaterial, crearMaterial, actualizarMaterial, desactivarMaterial, getValorizacion } = require('../controllers/materialController');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { verificarEliminacion, eliminarDefinitivo } = require('../controllers/eliminacionController');

router.get('/', verifyToken, getMateriales);
// CU 26 / UR-F-29 - Valoración FIFO del inventario (antes de /:id para que no la capture)
router.get('/valorizacion', verifyToken, requireAdmin, getValorizacion);
router.get('/:id', verifyToken, getMaterial);
router.post('/', verifyToken, requireAdmin, crearMaterial);
router.put('/:id', verifyToken, requireAdmin, actualizarMaterial);
router.delete('/:id', verifyToken, requireAdmin, desactivarMaterial);

// CU 49 - Validando integridad referencial en eliminaciones
router.get('/:id/dependencias', verifyToken, requireAdmin, verificarEliminacion('material'));
router.delete('/:id/definitivo', verifyToken, requireAdmin, eliminarDefinitivo('material'));

module.exports = router;
