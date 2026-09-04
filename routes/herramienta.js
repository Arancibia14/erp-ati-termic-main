const express = require('express');
const router = express.Router();
const {
  getHerramientas,
  getTrabajadoresActivos,
  crear,
  asignar,
  devolver,
  getHistorial
} = require('../controllers/herramientaController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// CU29 - Registrando asignación y trazabilidad de herramientas (Admin Total y Supervisor de Obra)
router.get('/', verifyToken, getHerramientas);
router.get('/trabajadores', verifyToken, getTrabajadoresActivos);
router.get('/historial', verifyToken, getHistorial);
// CU NUEVO 2 - Dando de alta herramientas en el catálogo maestro
router.post('/', verifyToken, requireAdmin, crear);
router.post('/asignar', verifyToken, asignar);
router.post('/:id/devolver', verifyToken, devolver);

module.exports = router;
