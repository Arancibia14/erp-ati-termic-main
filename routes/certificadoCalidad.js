const express = require('express');
const router = express.Router();
const { upload, getIngresos, getHistorialMaterial, cargarCertificado } = require('../controllers/certificadoCalidadController');
const { verifyToken } = require('../middleware/auth');

function subirArchivo(req, res, next) {
  upload.single('archivo')(req, res, err => {
    if (err) {
      // Excepción 1: Formato de archivo no válido u otro fallo
      return res.status(400).json({ success: false, error: err.message || 'Error al procesar el archivo' });
    }
    next();
  });
}

// CU38 - Gestionando certificados de calidad de materiales (Admin Total y Supervisor de Obra)
router.get('/ingresos', verifyToken, getIngresos);
router.get('/material/:materialId', verifyToken, getHistorialMaterial);
router.post('/', verifyToken, subirArchivo, cargarCertificado);

module.exports = router;
