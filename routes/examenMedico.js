const express = require('express');
const router = express.Router();
const { upload, getExamenesTrabajador, cargarExamen } = require('../controllers/examenMedicoController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

function subirArchivo(req, res, next) {
  upload.single('archivo')(req, res, err => {
    if (err) {
      // Excepción 1: Formato no permitido u otro fallo de archivo
      return res.status(400).json({ success: false, error: err.message || 'Error al procesar el archivo' });
    }
    next();
  });
}

// CU25 - Gestionando certificados de exámenes médicos
router.get('/:rut', verifyToken, requireAdmin, getExamenesTrabajador);
router.post('/', verifyToken, requireAdmin, subirArchivo, cargarExamen);

module.exports = router;
