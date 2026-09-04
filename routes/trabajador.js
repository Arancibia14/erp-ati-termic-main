const express = require('express');
const router = express.Router();
const { getEspecialidades, getTrabajadores, crearTrabajador, actualizarTrabajador, desactivarTrabajador } = require('../controllers/trabajadorController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/especialidades', verifyToken, requireAdmin, getEspecialidades);
router.get('/', verifyToken, requireAdmin, getTrabajadores);
router.post('/', verifyToken, requireAdmin, crearTrabajador);
router.put('/:rut', verifyToken, requireAdmin, actualizarTrabajador);
router.delete('/:rut', verifyToken, requireAdmin, desactivarTrabajador);

module.exports = router;
