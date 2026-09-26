const express = require('express');
const router = express.Router();
const { getEspecialidades, getTrabajadores, crearTrabajador, actualizarTrabajador, desactivarTrabajador } = require('../controllers/trabajadorController');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { verificarEliminacion, eliminarDefinitivo } = require('../controllers/eliminacionController');

router.get('/especialidades', verifyToken, requireAdmin, getEspecialidades);
router.get('/', verifyToken, requireAdmin, getTrabajadores);
router.post('/', verifyToken, requireAdmin, crearTrabajador);
router.put('/:rut', verifyToken, requireAdmin, actualizarTrabajador);
router.delete('/:rut', verifyToken, requireAdmin, desactivarTrabajador);

// CU 49 - Validando integridad referencial en eliminaciones
router.get('/:id/dependencias', verifyToken, requireAdmin, verificarEliminacion('trabajador'));
router.delete('/:id/definitivo', verifyToken, requireAdmin, eliminarDefinitivo('trabajador'));

module.exports = router;
