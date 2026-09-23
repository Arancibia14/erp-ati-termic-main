const express = require('express');
const router = express.Router();
const { solicitarRecuperacion, restablecerContrasena } = require('../controllers/recuperacionController');

// CU06 - Solicitando recuperación de credenciales (sin sesión: el usuario no puede loguearse)
router.post('/solicitar', solicitarRecuperacion);

// CU07 - Restableciendo contraseña de acceso (sin sesión)
router.post('/restablecer', restablecerContrasena);

module.exports = router;
