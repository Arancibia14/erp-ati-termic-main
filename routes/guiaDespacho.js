const express = require('express');
const router = express.Router();
const {
  getProveedores,
  getOrdenesCompra,
  getGuias,
  crearGuia,
  getGuiasRegistradas,
  confirmarDespacho
} = require('../controllers/guiaDespachoController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/proveedores', verifyToken, getProveedores);
router.get('/ordenes-compra', verifyToken, getOrdenesCompra);
// CU NUEVO 3 - Confirmando despacho de guía por el proveedor
router.get('/registradas', verifyToken, requireAdmin, getGuiasRegistradas);
router.post('/:id/confirmar-despacho', verifyToken, requireAdmin, confirmarDespacho);
router.get('/', verifyToken, getGuias);
router.post('/', verifyToken, crearGuia);

module.exports = router;
