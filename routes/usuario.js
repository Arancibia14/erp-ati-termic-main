const express = require('express');
const router = express.Router();
const { getUsuarios, crearUsuario } = require('../controllers/usuarioController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// CU NUEVO 5 - Registrando nuevo usuario del sistema
router.get('/', verifyToken, requireAdmin, getUsuarios);
router.post('/', verifyToken, requireAdmin, crearUsuario);

module.exports = router;
