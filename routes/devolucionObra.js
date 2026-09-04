const express = require('express');
const router = express.Router();
const {
  getMaterialesDespachados,
  getDespachado,
  registrarReingreso,
  getHistorial
} = require('../controllers/devolucionObraController');
const { verifyToken } = require('../middleware/auth');

// CU32 - Registrando reingreso de materiales sobrantes (Admin Total y Supervisor de Obra)
router.get('/materiales', verifyToken, getMaterialesDespachados);
router.get('/despachado', verifyToken, getDespachado);
router.get('/historial', verifyToken, getHistorial);
router.post('/', verifyToken, registrarReingreso);

module.exports = router;
