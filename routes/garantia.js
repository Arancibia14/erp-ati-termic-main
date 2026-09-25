const express = require('express');
const router = express.Router();
const { upload, cargarGarantia, buscarGarantias, descargarGarantia } = require('../controllers/garantiaController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

function subirArchivo(req, res, next) {
  upload.single('archivo')(req, res, err => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message || 'Error al procesar el archivo' });
    }
    next();
  });
}

// CU43 - Descargando certificados de garantía de equipos (solo Administrador Total)
router.get('/', verifyToken, requireAdmin, buscarGarantias);
router.post('/:numero_serie/descargar', verifyToken, requireAdmin, descargarGarantia);

// CU NUEVO 7 - Cargando certificados de garantía de equipos
router.post('/:numero_serie', verifyToken, requireAdmin, subirArchivo, cargarGarantia);

module.exports = router;
