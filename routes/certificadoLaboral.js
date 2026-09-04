const express = require('express');
const router = express.Router();
const { upload, getCertificadosProyecto, cargarCertificados } = require('../controllers/certificadoLaboralController');
const { verifyToken } = require('../middleware/auth');

function subirArchivos(req, res, next) {
  upload.fields([{ name: 'f30', maxCount: 1 }, { name: 'f30_1', maxCount: 1 }])(req, res, err => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message || 'Error al procesar el archivo' });
    }
    next();
  });
}

router.get('/:codigo', verifyToken, getCertificadosProyecto);
router.post('/', verifyToken, subirArchivos, cargarCertificados);

module.exports = router;
