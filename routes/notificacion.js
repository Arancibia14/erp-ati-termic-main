const express = require('express');
const router = express.Router();
const { getMisNotificaciones, marcarLeidas, borrarNotificacion, borrarTodas } = require('../controllers/notificacionController');
const { verifyToken } = require('../middleware/auth');

// Notificaciones del usuario conectado (CU 17 y CU 57). Cualquier rol ve solo las suyas.
router.get('/', verifyToken, getMisNotificaciones);
router.put('/leidas', verifyToken, marcarLeidas);
router.delete('/:id', verifyToken, borrarNotificacion);
router.delete('/', verifyToken, borrarTodas);

module.exports = router;
