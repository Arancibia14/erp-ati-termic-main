const express = require('express');
const router = express.Router();
const { recibirImagen, getAvisos, getAvisosVigentes, crearAviso, actualizarAviso, cambiarEstado } = require('../controllers/avisoController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// CU 46 - Gestionando avisos temporales (módulo "Avisos Internos").
// Los vigentes los ve cualquier usuario en Inicio; la gestión es solo del Administrador Total.
router.get('/vigentes', verifyToken, getAvisosVigentes);
router.get('/', verifyToken, requireAdmin, getAvisos);
router.post('/', verifyToken, requireAdmin, recibirImagen, crearAviso);
router.put('/:id', verifyToken, requireAdmin, recibirImagen, actualizarAviso);
router.put('/:id/estado', verifyToken, requireAdmin, cambiarEstado);

module.exports = router;
