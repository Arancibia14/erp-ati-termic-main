const express = require('express');
const router = express.Router();
const { upload, getModelos, crearModelo, getDocumentosModelo, subirDocumento } = require('../controllers/equipoController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

function subirArchivo(req, res, next) {
  upload.single('archivo')(req, res, err => {
    if (err) {
      // Excepción 1: Formato no compatible u otro fallo de archivo
      return res.status(400).json({ success: false, error: err.message || 'Error al procesar el archivo' });
    }
    next();
  });
}

// CU33 - Catálogo de Equipos y documentación técnica adjunta
router.get('/modelos', verifyToken, requireAdmin, getModelos);
// CU NUEVO 1 - Dando de alta modelos de equipo HVAC
router.post('/modelos', verifyToken, requireAdmin, crearModelo);
router.get('/modelos/:id/documentos', verifyToken, requireAdmin, getDocumentosModelo);
router.post('/modelos/:id/documentos', verifyToken, requireAdmin, subirArchivo, subirDocumento);

module.exports = router;
