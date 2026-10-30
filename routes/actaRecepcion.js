const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const {
  getObrasHabilitadas,
  getDatosObra,
  generarActa,
  listarActas,
  anularActa,
  reenviarCorreoActa
} = require('../controllers/actaRecepcionController');

// CU 68 - Generando acta de recepción final de obra
router.get('/obras', verifyToken, getObrasHabilitadas);
router.get('/obras/:codigo', verifyToken, getDatosObra);
router.get('/', verifyToken, listarActas);
router.post('/', verifyToken, generarActa);
router.post('/:id/reenviar', verifyToken, reenviarCorreoActa);
router.post('/:id/anular', verifyToken, requireAdmin, anularActa);

module.exports = router;
