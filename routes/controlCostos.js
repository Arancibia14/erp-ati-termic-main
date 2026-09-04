const express = require('express');
const router = express.Router();
const { getProyectosConPresupuesto, getGastosReales, getGastosPorMes, getUmbralDesviacion } = require('../controllers/controlCostosController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// CU41 - Graficando Desviación de Costos
router.get('/proyectos', verifyToken, requireAdmin, getProyectosConPresupuesto);
router.get('/parametro/umbral', verifyToken, requireAdmin, getUmbralDesviacion);
router.get('/:codigo/gastos', verifyToken, requireAdmin, getGastosReales);
router.get('/:codigo/gastos-por-mes', verifyToken, requireAdmin, getGastosPorMes);

module.exports = router;
