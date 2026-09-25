const express = require('express');
const router = express.Router();
const {
  upload,
  getHerramientas,
  getTrabajadoresActivos,
  crear,
  asignar,
  devolver,
  getHistorial,
  getDocumentos,
  subirDocumento
} = require('../controllers/herramientaController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

function subirArchivo(req, res, next) {
  upload.single('archivo')(req, res, err => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message || 'Error al procesar el archivo' });
    }
    next();
  });
}

// CU29 - Registrando asignación y trazabilidad de herramientas (Admin Total y Supervisor de Obra)
router.get('/', verifyToken, getHerramientas);
router.get('/trabajadores', verifyToken, getTrabajadoresActivos);
router.get('/historial', verifyToken, getHistorial);
// CU NUEVO 2 - Dando de alta herramientas en el catálogo maestro
router.post('/', verifyToken, requireAdmin, crear);
router.post('/asignar', verifyToken, asignar);
router.post('/:id/devolver', verifyToken, devolver);
// CU50 - Centralizando documentación técnica de herramientas (solo Administrador Total)
router.get('/:id/documentos', verifyToken, requireAdmin, getDocumentos);
router.post('/:id/documentos', verifyToken, requireAdmin, subirArchivo, subirDocumento);

module.exports = router;
