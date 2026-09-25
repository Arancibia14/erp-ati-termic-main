const express = require('express');
const router = express.Router();
const { getEventos, getPlantilla, actualizarPlantilla } = require('../controllers/plantillaCorreoController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// CU48 - Editando plantillas de correo electrónico (solo Administrador Total)
router.get('/', verifyToken, requireAdmin, getEventos);
router.get('/:evento', verifyToken, requireAdmin, getPlantilla);
router.put('/:evento', verifyToken, requireAdmin, actualizarPlantilla);

module.exports = router;
