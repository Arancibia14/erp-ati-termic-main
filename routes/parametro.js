const express = require('express');
const router = express.Router();
const { getTributarios, actualizarTributarios, getIvaVigente } = require('../controllers/parametroController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// CU52 - Configurando parámetros de IVA y retenciones (solo Administrador Total)
router.get('/tributarios', verifyToken, requireAdmin, getTributarios);
router.put('/tributarios', verifyToken, requireAdmin, actualizarTributarios);

// CU53 - IVA vigente para el desglose previo (OC del administrador y gastos de caja chica del supervisor)
router.get('/iva-vigente', verifyToken, getIvaVigente);

module.exports = router;
