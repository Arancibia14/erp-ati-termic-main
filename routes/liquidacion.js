const express = require('express');
const router = express.Router();
const { upload, getLiquidacionesTrabajador, cargarLiquidacion } = require('../controllers/liquidacionController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

function subirArchivo(req, res, next) {
  upload.single('archivo')(req, res, err => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message || 'Error al procesar el archivo' });
    }
    next();
  });
}

router.get('/:rut', verifyToken, requireAdmin, getLiquidacionesTrabajador);
router.post('/', verifyToken, requireAdmin, subirArchivo, cargarLiquidacion);

module.exports = router;
