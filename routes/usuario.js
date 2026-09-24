const express = require('express');
const router = express.Router();
const { getUsuarios, crearUsuario, cambiarRol } = require('../controllers/usuarioController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// CU NUEVO 5 - Registrando nuevo usuario del sistema
router.get('/', verifyToken, requireAdmin, getUsuarios);
router.post('/', verifyToken, requireAdmin, crearUsuario);

// CU02 - Gestionando niveles de acceso (solo Administrador Total)
router.put('/:rut/rol', verifyToken, requireAdmin, cambiarRol);

module.exports = router;
