const express = require('express');
const router = express.Router();
const {
  getProyectos, getSaldo, registrarEgreso, getEgresosByProyecto, recibirComprobante, adjuntarComprobante
} = require('../controllers/cajaChicaController');
const { verifyToken } = require('../middleware/auth');

router.get('/proyectos', verifyToken, getProyectos);
router.get('/saldo/:codigo', verifyToken, getSaldo);
router.get('/:codigo/egresos', verifyToken, getEgresosByProyecto);
router.post('/', verifyToken, registrarEgreso);

// CU40 - Adjuntando comprobante de gasto (Supervisor de Obra y Administrador Total)
router.post('/egreso/:id/comprobante', verifyToken, recibirComprobante, adjuntarComprobante);

module.exports = router;
