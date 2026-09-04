const express = require('express');
const router = express.Router();
const {
  getTrabajadoresActivos,
  getCatalogoEpp,
  crearEntrega,
  getHistorial,
  validarEntrega,
  generarComprobante
} = require('../controllers/entregaEppController');
const { verifyToken } = require('../middleware/auth');

// CU22 - Registrando Entrega de EPP
router.get('/trabajadores', verifyToken, getTrabajadoresActivos);
router.get('/catalogo', verifyToken, getCatalogoEpp);
router.post('/', verifyToken, crearEntrega);

// CU23 - Historial y generación de comprobante firmado
router.get('/historial', verifyToken, getHistorial);
router.post('/:lote/comprobante', verifyToken, generarComprobante);

// CU24 - Validación de recepción mediante firma digital
router.post('/:lote/validar', verifyToken, validarEntrega);

module.exports = router;
